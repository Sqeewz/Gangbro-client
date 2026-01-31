import { Component, inject, signal, OnInit, OnDestroy, effect } from '@angular/core';
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
  chatMessages = signal<{ user: string, text: string, time: Date }[]>([]);
  newMessageText = signal('');

  private _missionId?: number;
  private _ws?: WebSocket;

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

    const baseUrl = environment.baseUrl === '/' ?
      `${window.location.protocol}//${window.location.host}` :
      environment.baseUrl;

    const wsProtocol = baseUrl.startsWith('https') ? 'wss:' : 'ws:';
    const host = baseUrl.replace(/^https?:\/\//, '');
    const wsUrl = `${wsProtocol}//${host}/api/mission-chats/ws/${this._missionId}`;

    console.log('Connecting to WebSocket:', wsUrl);
    this._ws = new WebSocket(wsUrl);

    this._ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        const newMessage = {
          user: data.brawler_name,
          text: data.message,
          time: new Date(data.created_at)
        };

        // Append new message if it doesn't exist (avoid duplicates from POST refresh)
        this.chatMessages.update(msgs => {
          // simple check by text and time or ID if available
          const exists = msgs.some(m =>
            m.text === newMessage.text &&
            new Date(m.time).getTime() === newMessage.time.getTime() &&
            m.user === newMessage.user
          );
          if (!exists) return [...msgs, newMessage];
          return msgs;
        });
      } catch (e) {
        console.error('WS Message error', e);
      }
    };

    this._ws.onclose = () => {
      console.log('WebSocket disconnected. Reconnecting in 5s...');
      setTimeout(() => {
        if (this._missionId) this.connectWs();
      }, 5000);
    };

    this._ws.onerror = (error) => {
      console.error('WebSocket error:', error);
    };
  }

  disconnectWs() {
    if (this._ws) {
      this._ws.onclose = null; // Prevent auto-reconnect
      this._ws.close();
      this._ws = undefined;
    }
  }

  async loadChat() {
    if (!this._missionId) return;
    try {
      const messages = await this._missionService.getChatMessages(this._missionId);
      this.chatMessages.set(messages.map(m => ({
        user: m.brawler_name,
        text: m.message,
        time: new Date(m.created_at)
      })));
    } catch (e) {
      console.error('Failed to load chat', e);
    }
  }

  async sendMessage() {
    const text = this.newMessageText().trim();
    if (!text || !this._missionId) return;

    try {
      // Send via HTTP POST - The server will broadcast it via WebSocket to everyone
      await this._missionService.sendChatMessage(this._missionId, text);
      this.newMessageText.set('');
      // No need to call loadChat() as WS will deliver the message
    } catch (e) {
      console.error('Failed to send message', e);
    }
  }
}
