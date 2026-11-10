import '@fontsource/press-start-2p/400.css';
import '@fontsource/vt323/400.css';
import './style.css';
import './resume-page.css';
import { startAnalytics } from './analytics';

// Each <section id> on this page is timed by Dossier with the same keys the room's
// overlays use, so "projects" means the same thing in both places.
const { dossier, capture } = startAnalytics({ sections: 'section[id]' });

document.getElementById('print-resume')?.addEventListener('click', () => {
  dossier.track('print_resume');
  capture('print_resume');
  window.print();
});
