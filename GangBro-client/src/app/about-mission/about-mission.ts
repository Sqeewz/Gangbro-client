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
import { MatSnackBar } from '@angular/material/snack-bar';

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

  mission = signal<Mission | null>(null);
  roster = signal<Brawler[]>([]);
  isLoading = signal(true);

  // Current user's name for highlighting own messages
  currentUserName = signal<string>('');

  // Chat signals
  chatMessages = signal<{ id?: number; user: string; text: string; time: Date }[]>([]);
  newMessageText = signal('');

  private _missionId?: number;
  private _pollingHandle: any;
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
          this._missionService.getRoster(this._missionId).catch(() => []), // Soft fail for roster
        ]);
        this.mission.set(missionData);
        this.roster.set(rosterData);

        // 2. Initial load of chat
        await this.loadChat();

        // 3. Start Polling for "Live" feel
        this.startPolling();
      } catch (error) {
        console.error('Failed to load mission details', error);
        this._snackBar.open('GRID SYNC FAILURE: Could not locate mission intel.', 'OK', { duration: 5000 });
      } finally {
        this.isLoading.set(false);
      }
    }
  }

  ngOnDestroy() {
    this.stopPolling();
  }

  private startPolling() {
    this.stopPolling();

    // Check if we already have the system message
    const hasInitMsg = this.chatMessages().some(m => m.user === 'SYSTEM' && m.text.includes('SECURE COMMS ACTIVE'));

    if (!hasInitMsg) {
      const statusMsg = {
        user: 'SYSTEM',
        text: 'SECURE COMMS ACTIVE (Polling Mode)',
        time: new Date()
      };
      this.chatMessages.update(msgs => [...msgs, statusMsg]);
    }

    // Poll every 3 seconds for new messages
    // We use NgZone to avoid triggering change detection on every poll if unnecessary
    this._ngZone.runOutsideAngular(() => {
      this._pollingHandle = setInterval(() => {
        this.loadChat();
      }, 3000);
    });
    console.log('[Chat] Polling started (3s interval)');
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

      const newMessages = messages.map((m) => ({
        id: m.id,
        user: m.brawler_name,
        text: m.message,
        time: new Date(m.created_at),
      }));

      // Only update if number of messages changed or IDs are different (efficient update)
      const current = this.chatMessages().filter(m => m.user !== 'SYSTEM');
      if (newMessages.length !== current.length ||
        (newMessages.length > 0 && newMessages[newMessages.length - 1].id !== current[current.length - 1]?.id)) {

        // Preserve SYSTEM messages if any
        const systems = this.chatMessages().filter(m => m.user === 'SYSTEM');

        this._ngZone.run(() => {
          this.chatMessages.set([...systems, ...newMessages]);
        });
      }
    } catch (e) {
      console.warn('Chat poll missed connection');
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
      // Immediate refresh after sending
      await this.loadChat();
    } catch (e: any) {
      console.error('Failed to send message:', e);
      let errorMsg = 'TRANSMISSION FAILED: GRID DISTURBANCE.';
      if (e.status === 401) errorMsg = 'AUTHORIZATION EXPIRED: LOGIN AGAIN.';
      if (e.status === 500) errorMsg = 'HQ SERVER CRASH: TRY AGAIN LATER.';

      this._snackBar.open(errorMsg, 'OK', { duration: 4000 });
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
