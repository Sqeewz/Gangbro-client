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
  chatMessages = signal<{ id?: number, user: string, text: string, time: Date }[]>([]);
  newMessageText = signal('');

  private _missionId?: number;
  private _ws?: WebSocket;
  private _heartbeatHandle: any;
  private _ngZone = inject(NgZone);

  constructor() {
    // Effect to persist chat messages to localStorage whenever they change
    effect(() => {
      const messages = this.chatMessages();
      if (this._missionId && messages.length > 0) {
        localStorage.setItem(`chat_cache_${this._missionId}`, JSON.stringify(messages));
      }
    });

    const passport = this._passportService.data();
    if (passport) {
      this.currentUserName.set(passport.display_name);
    }

    // Effect to scroll chat to bottom when messages change
    effect(() => {
      this.chatMessages();
      setTimeout(() => this.scrollToBottom(), 100);
    });
  }

  async ngOnInit() {
    const id = this._route.snapshot.paramMap.get('id');
    if (id) {
      this._missionId = +id;

      // 1. Try to load from cache immediately for instant UI
      const cached = localStorage.getItem(`chat_cache_${this._missionId}`);
      if (cached) {
        try {
          this.chatMessages.set(JSON.parse(cached));
        } catch (e) {
          console.error('Failed to parse cached chat', e);
        }
      }

      try {
        const [missionData, rosterData] = await Promise.all([
          this._missionService.getById(this._missionId),
          this._missionService.getRoster(this._missionId)
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

    // Use current location for WS host, handle protocol correctly
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    let host = window.location.host;

    // Optional: If environment has a specific baseUrl, extract host from it
    if (environment.baseUrl && environment.baseUrl.startsWith('http')) {
      try {
        const url = new URL(environment.baseUrl);
        host = url.host;
      } catch (e) {
        // Fallback to current host
      }
    }

    const wsUrl = `${protocol}//${host}/api/mission-chats/ws/${this._missionId}`;

    console.log('[Chat] Connecting to:', wsUrl);
    this._ws = new WebSocket(wsUrl);

    this._ws.onopen = () => {
      console.log('[Chat] WebSocket Connected');
      this.startHeartbeat();
    };

    this._ws.onmessage = (event) => {
      this._ngZone.run(() => {
        try {
          const data = JSON.parse(event.data);

          // Deduplication based on ID
          const isDuplicate = this.chatMessages().some(m => m.id === data.id);
          if (isDuplicate) return;

          const newMessage = {
            id: data.id,
            user: data.brawler_name,
            text: data.message,
            time: new Date(data.created_at)
          };

          this.chatMessages.update(msgs => [...msgs, newMessage]);

          // Auto scroll
          setTimeout(() => this.scrollToBottom(), 50);
        } catch (e) {
          console.error('[Chat] Handle message error', e);
        }
      });
    };

    this._ws.onclose = (event) => {
      this.stopHeartbeat();
      console.log(`[Chat] WebSocket Disconnected (Code: ${event.code}). Reconnecting in 3s...`);
      setTimeout(() => {
        if (this._missionId && !this._ws) this.connectWs();
      }, 3000);
    };

    this._ws.onerror = (error) => {
      console.error('[Chat] WebSocket Error', error);
    };
  }

  private startHeartbeat() {
    this.stopHeartbeat();
    this._heartbeatHandle = setInterval(() => {
      if (this._ws && this._ws.readyState === WebSocket.OPEN) {
        this._ws.send('ping');
      }
    }, 25000); // 25 seconds ping (Render timeout is ~30s)
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
      this.chatMessages.set(messages.map(m => ({
        id: m.id,
        user: m.brawler_name,
        text: m.message,
        time: new Date(m.created_at)
      })));
    } catch (e) {
      console.error('Failed to load chat', e);
    }
  }

  scrollToBottom() {
    const chatDisplay = document.querySelector('.chat-display');
    if (chatDisplay) {
      chatDisplay.scrollTop = chatDisplay.scrollHeight;
    }
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
