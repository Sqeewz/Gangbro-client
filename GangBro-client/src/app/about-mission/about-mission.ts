import { Component, inject, signal, OnInit, OnDestroy, effect, NgZone } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { MissionService } from '../_service/mission-service';
import { PassportService } from '../_service/passport-service';
import { Mission } from '../_models/mission';
import { Brawler } from '../_models/brawler';
import { MatIconModule } from '@angular/material/icon';
import { FormsModule } from '@angular/forms';
import { environment } from '../../environments/environment';
import { CacheManager } from '../_helpers/cache';

@Component({
  selector: 'app-about-mission',
  standalone: true,
  imports: [CommonModule, RouterLink, MatIconModule, FormsModule],
  templateUrl: './about-mission.html',
  styleUrl: './about-mission.scss',
})
export class AboutMission implements OnInit, OnDestroy {
  private _route = inject(ActivatedRoute);
  private _missionService = inject(MissionService);
  private _passportService = inject(PassportService);

  mission = signal<Mission | null>(null);
  roster = signal<Brawler[]>([]);
  isLoading = signal(true);

  // Current user's name for highlighting own messages
  currentUserName = signal<string>('');

  // Chat signals
  chatMessages = signal<{ id?: number; user: string; text: string; time: Date }[]>([]);
  newMessageText = signal('');

  private _missionId?: number;
  private _ws?: WebSocket;
  private _heartbeatHandle: any;
  private _ngZone = inject(NgZone);

  constructor() {
    // Effect to scroll chat to bottom when messages change
    effect(() => {
      this.chatMessages();
      this.scrollToBottom();
    });

    // Effect to persist chat messages with CacheManager
    effect(() => {
      const messages = this.chatMessages();
      if (this._missionId && messages.length > 0) {
        CacheManager.set(`chat_cache_${this._missionId}`, messages, 24 * 60 * 60 * 1000); // 24h expiry
      }
    });

    const passport = this._passportService.data();
    if (passport) {
      this.currentUserName.set(passport.display_name);
    }
  }

  async ngOnInit() {
    const id = this._route.snapshot.paramMap.get('id');
    if (id) {
      this._missionId = +id;

      // 1. Try to load from cache
      const cached = CacheManager.get<{ id?: number; user: string; text: string; time: Date }[]>(
        `chat_cache_${this._missionId}`,
      );
      if (cached) {
        this.chatMessages.set(cached);
      }

      try {
        const [missionData, rosterData] = await Promise.all([
          this._missionService.getById(this._missionId),
          this._missionService.getRoster(this._missionId),
        ]);
        this.mission.set(missionData);
        this.roster.set(rosterData);

        // 2. Load fresh history from DB
        await this.loadChat();

        // 3. Connect WebSocket for real-time updates
        this.connectWs();
      } catch (error) {
        console.error('Failed to load mission details', error);
      } finally {
        this.isLoading.set(false);
      }
    }
  }

  ngOnDestroy() {
    this.disconnectWs();
  }

  connectWs() {
    if (!this._missionId) return;
    this.disconnectWs();

    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    let host = window.location.host;

    if (environment.baseUrl && environment.baseUrl.startsWith('http')) {
      try {
        const url = new URL(environment.baseUrl);
        host = url.host;
      } catch (e) { }
    }

    // Security: Send JWT token in query string
    const token = this._passportService.data()?.token || '';
    const wsUrl = `${protocol}//${host}/api/mission-chats/ws/${this._missionId}?token=${token}`;
    console.log(`[Chat] Attempting connection to ${wsUrl}`);

    this._ws = new WebSocket(wsUrl);

    this._ws.onopen = () => {
      console.log('%c[Chat] WebSocket Connection Established', 'color: #00ff00; font-weight: bold');
      this.startHeartbeat();

      // Visual confirmation for user
      this._ngZone.run(() => {
        const statusMsg = {
          user: 'SYSTEM',
          text: 'COMMS_ESTABLISHED :: REAL-TIME FEED ACTIVE',
          time: new Date()
        };
        this.chatMessages.update(msgs => [...msgs, statusMsg]);
      });
    };

    this._ws.onmessage = (event) => {
      this._ngZone.run(() => {
        try {
          if (event.data === 'pong') return;
          const data = JSON.parse(event.data);

          // Deduplication based on ID
          if (data.id && this.chatMessages().some((m) => m.id === data.id)) return;

          const newMessage = {
            id: data.id,
            user: data.brawler_name,
            text: data.message,
            time: new Date(data.created_at),
          };

          this.chatMessages.update((msgs) => [...msgs, newMessage]);
        } catch (e) {
          // Heartbeats or system pings from server
          if (event.data !== 'pong' && event.data !== 'ping') {
            // console.debug('[Chat] Non-JSON message:', event.data);
          }
        }
      });
    };

    this._ws.onclose = (event) => {
      this.stopHeartbeat();
      if (this._ws) {
        console.warn(`[Chat] Connection Closed (Code: ${event.code}). Reconnecting in 3s...`);
        this._ws = undefined;
        setTimeout(() => {
          if (this._missionId) this.connectWs();
        }, 3000);
      }
    };

    this._ws.onerror = (error) => {
      console.error('[Chat] WebSocket specific error detected:', error);
    };
  }

  private startHeartbeat() {
    this.stopHeartbeat();
    this._heartbeatHandle = setInterval(() => {
      if (this._ws && this._ws.readyState === WebSocket.OPEN) {
        this._ws.send('ping');
      }
    }, 20000); // 20s for Render stability
  }

  private stopHeartbeat() {
    if (this._heartbeatHandle) {
      clearInterval(this._heartbeatHandle);
      this._heartbeatHandle = undefined;
    }
  }

  disconnectWs() {
    this.stopHeartbeat();
    if (this._ws) {
      this._ws.onclose = null;
      this._ws.close();
      this._ws = undefined;
    }
  }

  async loadChat() {
    if (!this._missionId) return;
    try {
      const messages = await this._missionService.getChatMessages(this._missionId);
      this.chatMessages.set(
        messages.map((m) => ({
          id: m.id,
          user: m.brawler_name,
          text: m.message,
          time: new Date(m.created_at),
        })),
      );
      this.scrollToBottom();
    } catch (e) {
      console.error('Failed to load chat', e);
    }
  }

  scrollToBottom() {
    setTimeout(() => {
      const chatDisplay = document.querySelector('.chat-display');
      if (chatDisplay) {
        chatDisplay.scrollTop = chatDisplay.scrollHeight;
        // Double check for images loading
        setTimeout(() => {
          chatDisplay.scrollTop = chatDisplay.scrollHeight;
        }, 300);
      }
    }, 100);
  }

  async sendMessage() {
    const text = this.newMessageText().trim();
    if (!text || !this._missionId) return;

    try {
      await this._missionService.sendChatMessage(this._missionId, text);
      this.newMessageText.set('');
    } catch (e) {
      console.error('Failed to send message', e);
    }
  }

  ensureHttps(url: string | null): string {
    if (!url) return 'assets/def.jpg';
    if (url.startsWith('http://')) {
      return url.replace('http://', 'https://');
    }
    return url;
  }
}

