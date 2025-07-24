import { defineStore } from 'pinia';
import pb from 'src/config/pocketbase';

interface User {
  id: string;
  name: string;
  email: string;
  birthyear: number;
  homecourse?: string;
  category?: string;
  type?: string;
  auth_method?: string;
  role?: string;
  avatar?: string;
  token?: string;
  emailVisibility?: boolean;
}

interface AuthState {
  user: User | null;
  token: string | null;
  pb: typeof pb;
}

export const useAuthStore = defineStore('auth', {
  state: (): AuthState => ({
    user: null,
    token: null,
    pb: pb,
  }),

  getters: {
    isAuthenticated: (state) => !!state.token,
    currentUser: (state) => state.user,
  },

  actions: {
    async login(email: string, password: string) {
      try {
        const authData = await this.pb.collection('users').authWithPassword(email, password);
        this.user = { ...authData.record, token: authData.token } as User;
        this.token = authData.token;

        // Sla de token op in localStorage
        localStorage.setItem(
          'pb_auth',
          JSON.stringify({
            token: authData.token,
            model: authData.record,
          }),
        );

        return true;
      } catch (error) {
        console.error('Login error:', error);
        return false;
      }
    },

    async register(data: {
      name: string;
      email: string;
      password: string;
      passwordConfirm: string;
      birthyear: number;
    }) {
      try {
        await this.pb.collection('users').create(data);
        return true;
      } catch (error) {
        console.error('Registration error:', error);
        return false;
      }
    },

    async requestPasswordReset(email: string) {
      try {
        await this.pb.collection('users').requestPasswordReset(email);
        return true;
      } catch (error) {
        console.error('Password reset request error:', error);
        return false;
      }
    },

    async updateProfile(data: {
      name: string;
      birthyear: number;
      homecourse?: string;
      category?: string;
      avatar?: File;
      emailVisibility?: boolean;
      country?: string;
    }) {
      try {
        if (!this.user) throw new Error('Geen gebruiker ingelogd');

        const formData = new FormData();
        formData.append('name', data.name);
        formData.append('birthyear', data.birthyear.toString());
        if (data.homecourse) formData.append('homecourse', data.homecourse);
        if (data.category) formData.append('category', data.category);
        if (data.avatar) formData.append('avatar', data.avatar);
        if (typeof data.emailVisibility !== 'undefined') {
          formData.append('emailVisibility', data.emailVisibility.toString());
        }
        if (data.country) formData.append('country', data.country);

        console.log('Updating profile with data:', {
          name: data.name,
          birthyear: data.birthyear,
          homecourse: data.homecourse,
          category: data.category,
          emailVisibility: data.emailVisibility,
          hasAvatar: !!data.avatar,
          country: data.country,
        });

        const updatedUser = await this.pb.collection('users').update(this.user.id, formData);
        console.log('Updated user:', updatedUser);

        this.user = updatedUser as User;
        return true;
      } catch (error) {
        console.error('Profile update error:', error);
        return false;
      }
    },

    logout() {
      this.pb.authStore.clear();
      localStorage.removeItem('pb_auth');
      this.user = null;
      this.token = null;
    },

    async checkAuth() {
      try {
        // Probeer eerst de token uit localStorage te halen
        const storedAuth = localStorage.getItem('pb_auth');
        if (storedAuth) {
          const { token, model } = JSON.parse(storedAuth);
          if (token && model) {
            this.pb.authStore.save(token, model);
          }
        }

        // Controleer of we een geldige auth store hebben
        if (this.pb.authStore.isValid && this.pb.authStore.model?.id) {
          const user = await this.pb.collection('users').getOne(this.pb.authStore.model.id);
          this.user = { ...user, token: this.pb.authStore.token } as User;
          this.token = this.pb.authStore.token;
          return true;
        }
        return false;
      } catch (error) {
        console.error('Auth check error:', error);
        // Als er een fout optreedt, clear de auth store
        this.logout();
        return false;
      }
    },
  },
});
