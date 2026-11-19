import { APP_TITLE } from './core/constants';

const root = document.querySelector<HTMLElement>('#app');
if (root) {
  root.textContent = APP_TITLE;
}
