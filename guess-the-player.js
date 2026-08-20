'use strict';

const LANDSCAPE_VIDEO_PREFIX = 'GuessThePlayer_v';
const PORTRAIT_VIDEO_PREFIX = 'GuessThePlayerPortrait_v';
const VIDEO_EXTENSION = '.mp4';
const MAX_VIDEOS_TO_CHECK = 100;
const CHECK_BATCH_SIZE = 10;
const EMPTY_BATCHES_BEFORE_STOP = 1;

async function fileExists(file){
  try{
    const response = await fetch(file, { method:'HEAD', cache:'no-store' });
    return response.ok;
  }catch(error){
    return false;
  }
}

async function videoExists(number){
  // Prefer a portrait version on the video library page. If one has not been
  // uploaded yet, keep using the existing landscape version automatically.
  const portraitFile = PORTRAIT_VIDEO_PREFIX + number + VIDEO_EXTENSION;
  if(await fileExists(portraitFile)) return { number, file:portraitFile };

  const landscapeFile = LANDSCAPE_VIDEO_PREFIX + number + VIDEO_EXTENSION;
  return await fileExists(landscapeFile) ? { number, file:landscapeFile } : null;
}

async function discoverVideos(){
  const found = [];
  let emptyBatches = 0;
  for(let start = 1; start <= MAX_VIDEOS_TO_CHECK; start += CHECK_BATCH_SIZE){
    const checks = [];
    for(let number = start; number < start + CHECK_BATCH_SIZE && number <= MAX_VIDEOS_TO_CHECK; number++) checks.push(videoExists(number));
    const results = (await Promise.all(checks)).filter(Boolean);
    found.push(...results);
    emptyBatches = results.length ? 0 : emptyBatches + 1;
    if(found.length && emptyBatches >= EMPTY_BATCHES_BEFORE_STOP) break;
  }
  return found.sort((a,b) => b.number - a.number);
}

function createVideoCard(item){
  const article = document.createElement('article');
  article.className = 'guess-video-card';
  article.innerHTML = '<video controls playsinline preload="none" aria-label="Guess the Player video ' + item.number + '" data-src="' + item.file + '"></video><div class="guess-video-card-copy"><h3>Guess the Player #' + item.number + '</h3></div>';
  return article;
}

function activateLazyVideos(){
  const videos = [...document.querySelectorAll('video[data-src]')];
  const loadVideo = video => {
    if(video.src) return;
    video.src = video.dataset.src;
    video.preload = 'metadata';
    video.removeAttribute('data-src');
    video.load();
  };
  if(!('IntersectionObserver' in window)) return videos.forEach(loadVideo);
  const observer = new IntersectionObserver(entries => entries.forEach(entry => {
    if(entry.isIntersecting){ loadVideo(entry.target); observer.unobserve(entry.target); }
  }), { rootMargin:'300px 0px' });
  videos.forEach(video => observer.observe(video));
}

(async function initVideoLibrary(){
  const grid = document.getElementById('guessVideoGrid');
  const status = document.getElementById('guessVideoStatus');
  const videos = await discoverVideos();
  if(!videos.length){
    status.textContent = 'No Guess the Player videos are available yet.';
    return;
  }
  const fragment = document.createDocumentFragment();
  videos.forEach(video => fragment.appendChild(createVideoCard(video)));
  grid.appendChild(fragment);
  status.remove();
  activateLazyVideos();
})();
