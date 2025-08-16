import type { RouteLocationNormalized, NavigationGuardNext } from 'vue-router';
import { useAuthStore } from 'stores/auth';

export const authGuard = async (
  to: RouteLocationNormalized,
  from: RouteLocationNormalized,
  next: NavigationGuardNext,
) => {
  try {
    const authStore = useAuthStore();

    // Controleer eerst of we al een token hebben
    if (!authStore.token) {
      const storedAuth = localStorage.getItem('pb_auth');
      if (storedAuth) {
        try {
          const { token, model } = JSON.parse(storedAuth);
          if (token && model) {
            authStore.pb.authStore.save(token, model);
          }
        } catch (e) {
          console.error('Error parsing stored auth:', e);
          localStorage.removeItem('pb_auth');
        }
      }
    }

    const isAuthenticated = await authStore.checkAuth();
    console.log('Auth check result:', {
      isAuthenticated,
      hasToken: !!authStore.token,
      path: to.path,
      requiresAuth: to.meta.requiresAuth,
    });

    // Als we op de login pagina zijn en al ingelogd, redirect naar home
    if (to.path === '/auth/login' && isAuthenticated) {
      console.log('Already authenticated, redirecting to home');
      next('/');
      return;
    }

    // Als de route authenticatie vereist en we niet ingelogd zijn, redirect naar login
    if (to.meta.requiresAuth && !isAuthenticated) {
      console.log('Redirecting to login - requires auth but not authenticated');
      next('/auth/login');
      return;
    }

    // Als de route geen authenticatie vereist, altijd toestaan
    if (to.meta.requiresAuth === false) {
      console.log('Route is public, allowing access');
      next();
      return;
    }

    // Anders, ga door met navigatie
    console.log('Navigation allowed');
    next();
  } catch (error) {
    console.error('Auth guard error:', error);
    // Bij een fout, redirect naar login
    next('/auth/login');
  }
};
