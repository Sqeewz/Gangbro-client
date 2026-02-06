import { Component, inject, signal, OnInit, OnDestroy, effect, NgZone, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { MissionService } from '../_service/mission-service';
import { PassportService } from '../_service/passport-service';
import { Mission } from '../_models/mission';
import { Brawler } from '../_models/brawler';
import { MatIconModule } from '@angular/material/icon';
import { FormsModule } from '@angular/forms';
import { MatSnackBar } from '@angular/material/snack-bar';
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
  private _snackBar = inject(MatSnackBar);
  private _ngZone = inject(NgZone);

  mission = signal<Mission | null>(null);
  roster = signal<Brawler[]>([]);
  isLoading = signal(true);
  currentUserName = signal<string>('');
  chatMessages = signal<{ id?: number; user: string; text: string; time: Date }[]>([]);
  newMessageText = signal('');

  isChief = computed(() => {
    const m = this.mission();
    const p = this._passportService.data();
    return m && p && m.chief_id === p.user_id;
  });

  canStart = computed(() => {
    const m = this.mission();
    const r = this.roster();
    return m?.status === 'Open' && r.length >= 2;
  });

  private _missionId?: number;
  private _pollingHandle: any;
  private _socket?: WebSocket;

  constructor() {
    effect(() => {
      this.chatMessages();
      this.scrollToBottom();
    });

    effect(() => {
      const messages = this.chatMessages();
      if (this._missionId && messages.length > 0) {
        CacheManager.set(`chat_cache_${this._missionId}`, messages, 24 * 60 * 60 * 1000);
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

      const cached = CacheManager.get<{ id?: number; user: string; text: string; time: Date }[]>(`chat_cache_${this._missionId}`);
      if (cached) this.chatMessages.set(cached);

      try {
        const [missionData, rosterData] = await Promise.all([
          this._missionService.getById(this._missionId),
          this._missionService.getRoster(this._missionId).catch(() => []),
        ]);
        this.mission.set(missionData);
        this.roster.set(rosterData);

        await this.loadChat();
        this.startWebSocket();
      } catch (error) {
        console.error('Failed to load mission details', error);
        this._snackBar.open('GRID SYNC FAILURE: Could not locate mission intel.', 'OK', { duration: 5000 });
      } finally {
        this.isLoading.set(false);
      }
    }
  }

  ngOnDestroy() {
    this.stopWebSocket();
    this.stopPolling();
  }

  private startWebSocket() {
    this.stopWebSocket();
    const isSecure = window.location.protocol === 'https:';
    const protocol = isSecure ? 'wss:' : 'ws:';
    const host = window.location.host || window.location.hostname;
    const socketUrl = `${protocol}//${host}/api/mission-chats/ws/${this._missionId}`;

    try {
      this._socket = new WebSocket(socketUrl);
      this._socket.onopen = () => this.addSystemMessage('SECURE COMMS ACTIVE');
      this._socket.onmessage = (event) => {
        const data = JSON.parse(event.data);
        if (data && Array.isArray(data)) this.updateMessages(data);
        else if (data && data.type === 'new_message') this.loadChat();
      };
      this._socket.onclose = () => {
        this.addSystemMessage('CONNECTION LOST. RETRYING...');
        setTimeout(() => this.startWebSocket(), 5000);
      };
    } catch (e) {
      this.startPolling();
    }
  }

  private stopWebSocket() {
    if (this._socket) {
      this._socket.close();
      this._socket = undefined;
    }
  }

  private startPolling() {
    this.stopPolling();
    this.addSystemMessage('SECURE COMMS ACTIVE (Polling Mode)');
    this._ngZone.runOutsideAngular(() => {
      this._pollingHandle = setInterval(() => this.loadChat(), 3000);
    });
  }

  private stopPolling() {
    if (this._pollingHandle) {
      clearInterval(this._pollingHandle);
      this._pollingHandle = undefined;
    }
  }

  async loadChat() {
    if (!this._missionId) return;
    try {
      const messages = await this._missionService.getChatMessages(this._missionId);
      this.updateMessages(messages);
    } catch (e) {
      console.warn('Chat sync missed');
    }
  }

  private updateMessages(messages: any[]) {
    const newMessages = messages.map((m) => {
      // If time doesn't end with Z or offset, assume it's UTC from server
      let timeStr = m.created_at;
      if (timeStr && !timeStr.endsWith('Z') && !timeStr.includes('+')) {
        timeStr += 'Z';
      }
      return {
        id: m.id,
        user: m.brawler_name,
        text: m.message,
        time: new Date(timeStr),
      };
    });

    const current = this.chatMessages().filter(m => m.user !== 'SYSTEM');
    if (newMessages.length !== current.length ||
      (newMessages.length > 0 && newMessages[newMessages.length - 1].id !== current[current.length - 1]?.id)) {
      const systems = this.chatMessages().filter(m => m.user === 'SYSTEM');
      this._ngZone.run(() => this.chatMessages.set([...systems, ...newMessages]));
    }
  }

  private addSystemMessage(text: string) {
    if (!this.chatMessages().some(m => m.user === 'SYSTEM' && m.text === text)) {
      this.chatMessages.update(msgs => [...msgs, { user: 'SYSTEM', text, time: new Date() }]);
    }
  }

  scrollToBottom() {
    setTimeout(() => {
      const chatDisplay = document.querySelector('.chat-display');
      if (chatDisplay) {
        chatDisplay.scrollTop = chatDisplay.scrollHeight;
        setTimeout(() => { chatDisplay.scrollTop = chatDisplay.scrollHeight; }, 300);
      }
    }, 100);
  }

  async sendMessage() {
    const text = this.newMessageText().trim();
    if (!text || !this._missionId) return;
    try {
      await this._missionService.sendChatMessage(this._missionId, text);
      this.newMessageText.set('');
      await this.loadChat();
    } catch (e: any) {
      this._snackBar.open('TRANSMISSION FAILED: GRID DISTURBANCE.', 'OK', { duration: 4000 });
    }
  }

  ensureHttps(url: string | null): string {
    if (!url) return 'assets/def.jpg';
    return url.replace('http://', 'https://');
  }

  async onStart() {
    if (!this._missionId) return;
    try {
      await this._missionService.start(this._missionId);
      this._snackBar.open('MISSION PROTOCOL INITIATED.', 'OK', { duration: 3000 });
      const missionData = await this._missionService.getById(this._missionId);
      this.mission.set(missionData);
    } catch (e: any) {
      const msg = e?.error?.message || e?.error || 'START FAILED: GRID OFFLINE.';
      this._snackBar.open(msg, 'OK', { duration: 5000 });
    }
  }
}
