// ==UserScript==
// @name         Hentai Heroes SFW
// @namespace    https://sleazyfork.org/fr/scripts/539097-hentai-heroes-sfw
// @description  Removing explicit images in Hentai Heroes game and changing game background to a SFW one.
// @version      4.1.1
// @match        https://*.hentaiheroes.com/*
// @run-at       document-start
// @grant        none
// @author       Geto_hh
// @license      MIT
// ==/UserScript==

// ==CHANGELOG==
// 4.1.1: fix panel position
// 4.1.0: show NSFW icon when every settings are false
// 4.0.1: various fixes
// 4.0.0: Add settings icon and panel
// 3.12.1: Fix affection scenes
// 3.12.0: Update README.md
// 3.11.0: Update description
// 3.10.0: Hide login background
// 3.9.0: Hide champion's club girl avatars
// 3.8.0: Hide login video
// 3.7.0: Hide level up pop-up girl
// 3.6.1: Fix club champion css
// 3.6.0: Hide champions
// 3.5.0: Hide lse girl
// 3.4.0: Hide images in harem
// 3.3.2: Update description
// 3.3.1: Update description
// 3.3.0: Optimize code
// 3.2.0: Optimize and mutualize code, fix bugs (empty selector crash, dead ternary, QUEST TypeError, unused constant)
// 3.1.0: Refactor code to mutualize page lists
// 3.0.0: Remove girl img src modifications and observer due to girl media url changes that no longer allow the process
// 2.2.0: Add waifu page support
// 2.1.6: Fix event selectors
// 2.1.5: Fix event selectors
// 2.1.4: Fix harem selectors
// 2.1.3: Fix harem selectors
// 2.1.2: Fix harem selectors
// 2.1.1: Fix mobile login image removal
// 2.1.0: Remove mobile images
// 2.0.6: Trying Github webhook again
// 2.0.5: Trying Github webhook
// 2.0.4: Updating description
// 2.0.3: Fixed login screen img removal
// 2.0.2: Fixed champions css positions and mythic day lively scene
// 2.0.1: Fixed Harem avatar modification
// 2.0.0: Improved observer handling and delaying
// 1.12.2: Fix modify script
// 1.12.1: Fix various pages
// 1.12.0: Add penta-drill support
// 1.11.2: Add new pages and fix champions page display
// 1.11.1: Add leagues page support
// 1.11.0: Split avatars, icons & girl images
// 1.10.1: Fix css selectors
// 1.10.0: Add option to replace background
// 1.9.0: Add option to hide avatars
// 1.8.0: Add option to hide girls
// 1.7.0: Put observer back for girls and home background
// 1.6.0: Use style to hide images and background images
// 1.5.0: Split hide process and modify process & remove observer
// 1.4.0: Hide girls on the event and refill pop-up
// 1.3.0: Replace home page background image to alway have the same one and avoid NSFW ones
// 1.2.0: Allow user to show affection scene when clicking on eye icon
// 1.1.0: Page per page query selectors and optimized girl icons processing on edit team pages
// 1.0.1: Small fixes
// 1.0.0: Optimize script for release
// 0.6.0: Use only document query selectors and run continously
// 0.5.0: Optimized script for faster processing
// 0.4.0: Stop processing mutations when a 'diamond' or 'speech_bubble_info_icn' class element is clicked
// 0.3.0: Run script only once per page load
// 0.2.0: Added namespace
// 0.1.0: First available version on SleazyFork
// ==/CHANGELOG==

/**
 * CONFIGURATION
 */
const DEBUG_LIMIT_ACTIVATED = false;
const HIDE_ADDS = false;
const HIDE_BACKGROUND = false;

/**
 * VARIABLES
 */
// let is required — DEBUG_ACTIVATED is reassigned to false inside checkDebugLimit()
let DEBUG_ACTIVATED = true; // eslint-disable-line no-var
let debugLimitCount = 0;
let isCssInjected = false;
let isDOMReady = false;

/**
 * HHSFW SETTINGS — persisted in localStorage under the key 'HHSFW.settings'.
 * Defaults match the original hardcoded values.
 */
const HHSFW_DEFAULTS = {
  HIDE_EVENT_GIRLS_AVATARS : true,
  HIDE_HAREM_SELECTED_GIRL_AVATAR : true,
  HIDE_OTHER_GIRLS_AVATARS : true,
  HIDE_OTHER_PLAYERS_AVATARS : true,
  HIDE_VIDEO_PREVIEWS : true,
  REPLACE_BACKGROUND : true,
};

(function loadHhsfwSettings() {
  try {
    const stored = localStorage.getItem('HHSFW.settings');
    if (stored) {
      const parsed = JSON.parse(stored);
      Object.keys(HHSFW_DEFAULTS).forEach(function (key) {
        if (typeof parsed[key] === 'boolean') {
          HHSFW_DEFAULTS[key] = parsed[key];
        }
      });
    }
  } catch (e) {
    console.error('[HHSFW] Failed to load settings from localStorage:', e);
  }
})();

// Destructure once so PAGE_LIST can reference these as plain identifiers.
const {
  HIDE_EVENT_GIRLS_AVATARS,
  HIDE_HAREM_SELECTED_GIRL_AVATAR,
  HIDE_OTHER_GIRLS_AVATARS,
  HIDE_OTHER_PLAYERS_AVATARS,
  HIDE_VIDEO_PREVIEWS,
  REPLACE_BACKGROUND,
} = HHSFW_DEFAULTS;

/**
 * CONSTANTS
 */
const NEW_BACKGROUND_URL =
  'https://hh2.hh-content.com/pictures/gallery/6/2200x/401-a8339a2168753900db437d91f2ed39ff.jpg';

// Pre-evaluated once — avoids repeating the same conditional spread across every page entry
const PLAYER_AVATAR_SELECTORS = ['.player-profile-picture > img'];
const BACKGROUND_SELECTORS = ['.fixed_scaled > img'];
const VIDEO_PREVIEW_SELECTORS = [
  '.lively_scene > img',
  '.lively_scene-wrapper > .unlocked > img',
  '.lively_scenes_preview > div > img',
  '.lse_puzzle_wrapper > .lively_scene_image',
];

// Fallback values for pages that don't define their own — imagesSrcToReplace must be ''
// (not []) so processImagesSrcToReplace's !newSrc guard fires correctly.
const DEFAULT_VALUES = { cssToModify: [], imagesSrcToReplace: '' };

const PAGE_LIST = [
  {
    name : 'ALL',
    slug : '',
    selectors : {
      backgroundImagesSrcToHidePermanently : [
        '.bundle > #special-offer',
        '.bundle > #starter-offer',
        '#crosspromo_show_ad > .crosspromo_banner',
        '#crosspromo_show_localreward > .crosspromo_banner',
        '.mc-card-container > .rewards-container',
        '.product-offer-container > .product-offer-background-container',
      ],
      cssToModify : [],
      imagesSrcToReplace : [
        ...((REPLACE_BACKGROUND && !HIDE_BACKGROUND) ? BACKGROUND_SELECTORS : []),
      ],
      imagesSrcToHidePermanently : [
        '.background_image-style > img',
        '.background_image-style > source',
        '.video-background > .variant-video',
        '.intro > .quest-container > #scene > .canvas > .picture',
        '.background_image-style > img',
        '#no_energy_popup > .avatar',
        '.info-top-block > .bunny-rotate-device',
        '.container > .avatar',
        '.prestige > .avatar',
        '#special-offer > .background-video',
        '.pwa-info-container > .install_app_girl',
        ...(HIDE_ADDS ? [
          '.exo-native-widget',
          '.ad-revive-container',
        ] : []),
        ...(HIDE_BACKGROUND ? BACKGROUND_SELECTORS : []),
        ...(HIDE_HAREM_SELECTED_GIRL_AVATAR ? [
          '.avatar-box > .avatar',
          '.awakening-container > .avatar',
        ] : []),
        ...(HIDE_OTHER_GIRLS_AVATARS ? [
          '.rewards > .girl-avatar',
        ] : []),
        ...(HIDE_OTHER_PLAYERS_AVATARS ? PLAYER_AVATAR_SELECTORS : []),
        ...(HIDE_VIDEO_PREVIEWS ? VIDEO_PREVIEW_SELECTORS : []),
      ],
      imagesToHideTemporarily : [],
    },
    values : {
      cssToModify : [],
      // Only supply the replacement URL when the setting is enabled.
      // processImagesSrcToReplace() guards on !newSrc, so an empty string
      // ensures no replacement happens even if a selector somehow slips through.
      imagesSrcToReplace : REPLACE_BACKGROUND ? NEW_BACKGROUND_URL : '',
    },
  },
  {
    name : 'ACTIVITIES',
    slug : '/activities.html',
    selectors : {
      backgroundImagesSrcToHidePermanently : ['.contest > .contest_header'],
      cssToModify : [],
      imagesSrcToReplace : [],
      imagesSrcToHidePermanently : [
        '.mission_image > img',
        '.pop_thumb > img',
        '.pop-record > .pop-record-bg',
        '.timer-girl-container > img',
        ...(HIDE_EVENT_GIRLS_AVATARS ? ['.pop-details-left > img', '.pop_girl_avatar > img'] : []),
      ],
      imagesToHideTemporarily : [],
    },
  },
  {
    name : 'ADVENTURES',
    slug : '/adventures.html',
    selectors : {
      backgroundImagesSrcToHidePermanently : ['.adventure-card-container'],
      cssToModify : [],
      imagesSrcToReplace : [],
      imagesSrcToHidePermanently : [],
      imagesToHideTemporarily : [],
    },
  },
  {
    name : 'CHAMPIONS',
    slug : '/champions/',
    selectors : {
      backgroundImagesSrcToHidePermanently : [],
      cssToModify : [
        ['.girl-information'],
        ['.nc-event-reward-info'],
        ['.champions-over__champion-rewards-outline'],
        ['.champions-over__champion-wrapper > .champions-over__champion-info'],
        ['.champions-over__champion-tier-link'],
        ['.champions-over__girl-image'],
      ],
      imagesSrcToReplace : [],
      imagesSrcToHidePermanently : [
        '.champions-over__champion-wrapper > .champions-over__champion-image',
        '.champions-over__champion-wrapper > .champions-over__champion-dialog-box',
        '.defender-preview > img',
        '.attacker-preview > .character',
        '.rounds-info__figures > .figure',
        ...(HIDE_OTHER_GIRLS_AVATARS ? [
          '.champions-over__champion-wrapper > .avatar',
        ] : []),
      ],
      imagesToHideTemporarily : [],
    },
    values : {
      cssToModify : [
        ['display: flex', 'position: relative', 'left: 200px', 'top: 0px'],
        ['top: 0px', 'left: 100px'],
        ['display: flex', 'position: absolute', 'left: -250px', 'top: 50px', 'width: 100%'],
        ['display: flex', 'position: relative', 'left: -250px', 'top: 100px'],
        ['display: inline-flex', 'width: 2.5rem', 'height: 2.5rem'],
        ['top: -60px', 'right: 50px'],
      ],
      imagesSrcToReplace : [],
    },
  },
  {
    name : 'CHARACTERS',
    slug : '/characters/',
    selectors : {
      backgroundImagesSrcToHidePermanently : [],
      cssToModify : [],
      imagesSrcToReplace : [],
      imagesSrcToHidePermanently : [
        ...(HIDE_HAREM_SELECTED_GIRL_AVATAR ? [
          '.avatar-box > .avatar',
          '.awakening-container > .avatar',
        ] : []),
      ],
      imagesToHideTemporarily : [],
    },
  },
  {
    name : 'CLUB CHAMPION',
    slug : '/club-champion.html',
    selectors : {
      backgroundImagesSrcToHidePermanently : [],
      cssToModify : [
        ['.girl-information'],
        ['.nc-event-reward-info'],
        ['.champions-over__champion-rewards-outline'],
        ['.champions-over__champion-wrapper > .champions-over__champion-info'],
        ['.champions-over__champion-tier-link'],
        ['.champions-over__girl-image'],
      ],
      imagesSrcToReplace : [],
      imagesSrcToHidePermanently : [
        '.attacker-preview > .character',
        '.defender-preview > img',
        '.figure',
        '.champions-over__champion-wrapper > .champions-over__champion-image',
        '.champions-over__champion-wrapper > .champions-over__champion-dialog-box',
        '.girl-fav-position > .favorite-position',
        '.girl-card > .fav-position',
        ...(HIDE_EVENT_GIRLS_AVATARS ? [
          '.champions-over__champion-wrapper > .avatar',
        ] : []),
        ...(HIDE_OTHER_GIRLS_AVATARS ? [
          '.attacker-girl > .avatar',
          '.defender-girl > .avatar',
        ] : []),
      ],
      imagesToHideTemporarily : [],
    },
    values : {
      cssToModify : [
        ['display: flex', 'position: relative', 'left: 200px', 'top: 0px'],
        ['top: 0px', 'left: 100px'],
        ['display: flex', 'position: absolute', 'left: -250px', 'top: 50px', 'width: 100%'],
        ['display: flex', 'position: relative', 'left: -250px', 'top: 100px'],
        ['display: inline-flex', 'width: 2.5rem', 'height: 2.5rem'],
        ['top: -60px', 'right: 50px'],
      ],
      imagesSrcToReplace : [],
    },
  },
  {
    name : 'CLUBS',
    slug : '/clubs.html',
    selectors : {
      backgroundImagesSrcToHidePermanently : [],
      cssToModify : [],
      imagesSrcToReplace : [],
      imagesSrcToHidePermanently : [
        ...(HIDE_OTHER_PLAYERS_AVATARS ? ['.avatar'] : []),
      ],
      imagesToHideTemporarily : [],
    },
  },
  {
    name : 'EDIT LABYRINTH TEAM',
    slug : '/edit-labyrinth-team.html',
    selectors : {
      backgroundImagesSrcToHidePermanently : [],
      cssToModify : [],
      imagesSrcToReplace : [],
      imagesSrcToHidePermanently : [
        ...(HIDE_OTHER_GIRLS_AVATARS ? ['.girl-display > .avatar'] : []),
      ],
      imagesToHideTemporarily : [],
    },
  },
  {
    name : 'EDIT TEAM',
    slug : '/edit-team.html',
    selectors : {
      backgroundImagesSrcToHidePermanently : [],
      cssToModify : [],
      imagesSrcToReplace : [],
      imagesSrcToHidePermanently : [
        ...(HIDE_OTHER_GIRLS_AVATARS ? ['.girl-display > .avatar'] : []),
      ],
      imagesToHideTemporarily : [],
    },
  },
  {
    name : 'EDIT WORLD BOSS TEAM',
    slug : '/edit-world-boss-team.html',
    selectors : {
      backgroundImagesSrcToHidePermanently : [],
      cssToModify : [],
      imagesSrcToReplace : [],
      imagesSrcToHidePermanently : [
        ...(HIDE_OTHER_GIRLS_AVATARS ? ['.girl-display > .avatar'] : []),
      ],
      imagesToHideTemporarily : [],
    },
  },
  {
    name : 'EVENT',
    slug : '/event.html',
    selectors : {
      backgroundImagesSrcToHidePermanently : [],
      cssToModify : [],
      imagesSrcToReplace : [],
      imagesSrcToHidePermanently : [
        ...(HIDE_EVENT_GIRLS_AVATARS ? [
          '.column-girl > img',
          '.girls-container > .avatar',
          '.lse_girl_container > .avatar',
          '.right-container > .avatar',
          '.slide > .avatar',
          '.sm-static-girl > img',
        ] : []),
      ],
      imagesToHideTemporarily : [],
    },
  },
  {
    name : 'GIRL',
    slug : '/girl/',
    selectors : {
      backgroundImagesSrcToHidePermanently : [],
      cssToModify : [],
      imagesSrcToReplace : [],
      imagesSrcToHidePermanently : [
        ...(HIDE_HAREM_SELECTED_GIRL_AVATAR ? [
          '.awakening-container > .avatar',
          '.team-slot-container > img',
        ] : []),
      ],
      imagesToHideTemporarily : [],
    },
  },
  {
    name : 'GOD PATH',
    slug : '/god-path.html',
    selectors : {
      backgroundImagesSrcToHidePermanently : [],
      cssToModify : [],
      imagesSrcToReplace : [],
      imagesSrcToHidePermanently : [
        ...(HIDE_OTHER_GIRLS_AVATARS ? ['.feature-girl > .avatar'] : []),
        '.container-category > .feature-bgr',
      ],
      imagesToHideTemporarily : [],
    },
  },
  {
    name : 'HAREM',
    slug : '/harem.html',
    selectors : {
      backgroundImagesSrcToHidePermanently : [],
      cssToModify : [],
      imagesSrcToReplace : [],
      imagesSrcToHidePermanently : [
        ...(HIDE_HAREM_SELECTED_GIRL_AVATAR ? [
          '.avatar-box > .avatar',
          '.awakening-container > .avatar',
        ] : []),
      ],
      imagesToHideTemporarily : [],
    },
  },
  {
    name : 'HOME',
    slug : '/home.html',
    selectors : {
      backgroundImagesSrcToHidePermanently : [
        '#special-offer',
        '.news_page_content > .news_page_pic',
        '.news_thumb > .news_thumb_pic',
      ],
      cssToModify : [],
      // Only include the selector when the setting is enabled — mirrors the ALL entry logic.
      imagesSrcToReplace : [...(REPLACE_BACKGROUND ? ['.fixed_scaled > img'] : [])],
      imagesSrcToHidePermanently : [
        ...(HIDE_OTHER_GIRLS_AVATARS ? ['.waifu-container > .avatar'] : []),
        '.info-top-block > .bunny-rotate-device',
        '.pwa-info-container > .install_app_girl',
      ],
      imagesToHideTemporarily : [],
    },
    values : {
      cssToModify : [],
      imagesSrcToReplace : REPLACE_BACKGROUND ? NEW_BACKGROUND_URL : '',
    },
  },
  {
    name : 'LABYRINTH',
    slug : '/labyrinth.html',
    selectors : {
      backgroundImagesSrcToHidePermanently : [],
      cssToModify : [],
      imagesSrcToReplace : [],
      imagesSrcToHidePermanently : [
        ...(HIDE_EVENT_GIRLS_AVATARS ? [
          '.labyrinth-girl > .avatar',
          '.shop-labyrinth-girl > .avatar',
        ] : []),
      ],
      imagesToHideTemporarily : [],
    },
  },
  {
    name : 'LABYRINTH BATTLE',
    slug : '/labyrinth-battle.html',
    selectors : {
      backgroundImagesSrcToHidePermanently : [],
      cssToModify : [],
      imagesSrcToReplace : [],
      imagesSrcToHidePermanently : [
        ...(HIDE_OTHER_GIRLS_AVATARS ? [
          '.pvp-girls > .avatar',
          '.labyrinth-girl > .avatar',
        ] : []),
      ],
      imagesToHideTemporarily : [],
    },
  },
  {
    name : 'LABYRINTH ENTRANCE',
    slug : '/labyrinth-entrance.html',
    selectors : {
      backgroundImagesSrcToHidePermanently : [],
      cssToModify : [],
      imagesSrcToReplace : [],
      imagesSrcToHidePermanently : [
        ...(HIDE_EVENT_GIRLS_AVATARS ? ['.labyrinth-girl > .avatar'] : []),
      ],
      imagesToHideTemporarily : [],
    },
  },
  {
    name : 'LABYRINTH POOL SELECT',
    slug : '/labyrinth-pool-select.html',
    selectors : {
      backgroundImagesSrcToHidePermanently : [],
      cssToModify : [],
      imagesSrcToReplace : [],
      imagesSrcToHidePermanently : [],
      imagesToHideTemporarily : [],
    },
  },
  {
    name : 'LABYRINTH PRE-BATTLE',
    slug : '/labyrinth-pre-battle.html',
    selectors : {
      backgroundImagesSrcToHidePermanently : [],
      cssToModify : [],
      imagesSrcToReplace : [],
      imagesSrcToHidePermanently : [
        ...(HIDE_OTHER_GIRLS_AVATARS ? ['.labyrinth-girl > .avatar'] : []),
      ],
      imagesToHideTemporarily : [],
    },
  },
  {
    name : 'LEAGUES',
    slug : '/leagues.html',
    selectors : {
      backgroundImagesSrcToHidePermanently : [],
      cssToModify : [],
      imagesSrcToReplace : [],
      imagesSrcToHidePermanently : [
        ...(HIDE_EVENT_GIRLS_AVATARS ? ['.girl-block > .avatar'] : []),
        ...(HIDE_OTHER_PLAYERS_AVATARS ? ['.square-avatar-wrapper > img', '.player-profile-picture > img'] : []),
        '.tier_icons > img',
      ],
      imagesToHideTemporarily : [],
    },
  },
  {
    name : 'LEAGUE BATTLE',
    slug : '/league-battle.html',
    selectors : {
      backgroundImagesSrcToHidePermanently : [],
      cssToModify : [],
      imagesSrcToReplace : [],
      imagesSrcToHidePermanently : [
        ...(HIDE_OTHER_GIRLS_AVATARS ? ['.new-battle-girl-container > .avatar'] : []),
      ],
      imagesToHideTemporarily : [],
    },
  },
  {
    name : 'LEAGUE PRE-BATTLE',
    slug : '/league-pre-battle.html',
    selectors : {
      backgroundImagesSrcToHidePermanently : [],
      cssToModify : [],
      imagesSrcToReplace : [],
      imagesSrcToHidePermanently : [
        ...(HIDE_OTHER_GIRLS_AVATARS ? ['.girl-block > .avatar'] : []),
      ],
      imagesToHideTemporarily : [],
    },
  },
  {
    name : 'LOVE RAIDS',
    slug : '/love-raids.html',
    selectors : {
      backgroundImagesSrcToHidePermanently : [],
      cssToModify : [],
      imagesSrcToReplace : [],
      imagesSrcToHidePermanently : [
        ...(HIDE_EVENT_GIRLS_AVATARS ? [
          '.left-girl-container > .avatar',
          '.left-girl-container > .girl-img',
          '.right-girl-container > .avatar',
          '.right-girl-container > .girl-img',
        ] : []),
      ],
      imagesToHideTemporarily : [],
    },
  },
  {
    name : 'MEMBER PROGRESSION',
    slug : '/member-progression.html',
    selectors : {
      backgroundImagesSrcToHidePermanently : [],
      cssToModify : [],
      imagesSrcToReplace : [],
      imagesSrcToHidePermanently : ['.page-girl > img'],
      imagesToHideTemporarily : [],
    },
  },
  {
    name : 'PACHINKO',
    slug : '/pachinko.html',
    selectors : {
      backgroundImagesSrcToHidePermanently : [],
      cssToModify : [],
      imagesSrcToReplace : [],
      imagesSrcToHidePermanently : [
        '.pachinko_img > img',
      ],
      imagesToHideTemporarily : [],
    },
  },
  {
    name : 'PANTHEON',
    slug : '/pantheon.html',
    selectors : {
      backgroundImagesSrcToHidePermanently : [],
      cssToModify : [],
      imagesSrcToReplace : [],
      imagesSrcToHidePermanently : [
        ...(HIDE_OTHER_GIRLS_AVATARS ? ['.girl-container > .avatar'] : []),
        '.pantheon_bgr > .stage-bgr',
      ],
      imagesToHideTemporarily : [],
    },
  },
  {
    name : 'PANTHEON BATTLE',
    slug : '/pantheon-battle.html',
    selectors : {
      backgroundImagesSrcToHidePermanently : [],
      cssToModify : [],
      imagesSrcToReplace : [],
      imagesSrcToHidePermanently : [
        ...(HIDE_OTHER_GIRLS_AVATARS ? ['.new-battle-girl-container > .avatar'] : []),
      ],
      imagesToHideTemporarily : [],
    },
  },
  {
    name : 'PANTHEON PRE-BATTLE',
    slug : '/pantheon-pre-battle.html',
    selectors : {
      backgroundImagesSrcToHidePermanently : [],
      cssToModify : [],
      imagesSrcToReplace : [],
      imagesSrcToHidePermanently : [
        '.fixed_scaled > img',
        '.player-profile-picture > img',
      ],
      imagesToHideTemporarily : [],
    },
  },
  {
    name : 'PATH OF GLORY',
    slug : '/path-of-glory.html',
    selectors : {
      backgroundImagesSrcToHidePermanently : [],
      cssToModify : [],
      imagesSrcToReplace : [],
      imagesSrcToHidePermanently : [
        ...(HIDE_EVENT_GIRLS_AVATARS ? [
          '.left_side > .avatar',
          '.right_side > .avatar',
        ] : []),
        ...(HIDE_OTHER_PLAYERS_AVATARS ? ['.square-avatar-wrapper > img'] : []),
      ],
      imagesToHideTemporarily : [],
    },
  },
  {
    name : 'PATH OF VALOR',
    slug : '/path-of-valor.html',
    selectors : {
      backgroundImagesSrcToHidePermanently : [],
      cssToModify : [],
      imagesSrcToReplace : [],
      imagesSrcToHidePermanently : [
        ...(HIDE_EVENT_GIRLS_AVATARS ? [
          '.left_side > .avatar',
          '.right_side > .avatar',
        ] : []),
        ...(HIDE_OTHER_PLAYERS_AVATARS ? ['.square-avatar-wrapper > img'] : []),
      ],
      imagesToHideTemporarily : [],
    },
  },
  {
    name : 'PENTA DRILL',
    slug : '/penta-drill.html',
    selectors : {
      backgroundImagesSrcToHidePermanently : [],
      cssToModify : [],
      imagesSrcToReplace : [],
      imagesSrcToHidePermanently : [
        ...(HIDE_EVENT_GIRLS_AVATARS ? ['.girl_block > .avatar'] : []),
      ],
      imagesToHideTemporarily : [],
    },
  },
  {
    name : 'PENTA DRILL ARENA',
    slug : '/penta-drill-arena.html',
    selectors : {
      backgroundImagesSrcToHidePermanently : [],
      cssToModify : [],
      imagesSrcToReplace : [],
      imagesSrcToHidePermanently : [
        ...(HIDE_OTHER_GIRLS_AVATARS ? ['.girl_block > .avatar'] : []),
      ],
      imagesToHideTemporarily : [],
    },
  },
  {
    name : 'PENTA DRILL BATTLE',
    slug : '/penta-drill-battle.html',
    selectors : {
      backgroundImagesSrcToHidePermanently : [],
      cssToModify : [],
      imagesSrcToReplace : [],
      imagesSrcToHidePermanently : [
        ...(HIDE_OTHER_GIRLS_AVATARS ? ['.pvp-girls > .avatar'] : []),
      ],
      imagesToHideTemporarily : [],
    },
  },
  {
    name : 'PVP ARENA',
    slug : '/pvp-arena.html',
    selectors : {
      backgroundImagesSrcToHidePermanently : [],
      cssToModify : [],
      imagesSrcToReplace : [],
      imagesSrcToHidePermanently : [
        ...(HIDE_OTHER_GIRLS_AVATARS ? ['.feature-girl > .avatar'] : []),
      ],
      imagesToHideTemporarily : [],
    },
  },
  {
    name : 'QUEST',
    slug : '/quest/',
    selectors : {
      backgroundImagesSrcToHidePermanently : [],
      cssToModify : [],
      imagesSrcToReplace : [],
      imagesSrcToHidePermanently : [],
      imagesToHideTemporarily : ['.canvas > .picture'],
    },
  },
  {
    name : 'SEASON',
    slug : '/season.html',
    selectors : {
      backgroundImagesSrcToHidePermanently : [],
      cssToModify : [],
      imagesSrcToReplace : [],
      imagesSrcToHidePermanently : [
        ...(HIDE_EVENT_GIRLS_AVATARS ? ['.girl_block > .avatar'] : []),
      ],
      imagesToHideTemporarily : [],
    },
  },
  {
    name : 'SEASON ARENA',
    slug : '/season-arena.html',
    selectors : {
      backgroundImagesSrcToHidePermanently : [],
      cssToModify : [],
      imagesSrcToReplace : [],
      imagesSrcToHidePermanently : [],
      imagesToHideTemporarily : [],
    },
  },
  {
    name : 'SEASON BATTLE',
    slug : '/season-battle.html',
    selectors : {
      backgroundImagesSrcToHidePermanently : [],
      cssToModify : [],
      imagesSrcToReplace : [],
      imagesSrcToHidePermanently : [
        ...(HIDE_OTHER_GIRLS_AVATARS ? ['.new-battle-girl-container > .avatar'] : []),
      ],
      imagesToHideTemporarily : [],
    },
  },
  {
    name : 'SEASONAL',
    slug : '/seasonal.html',
    selectors : {
      backgroundImagesSrcToHidePermanently : [],
      cssToModify : [],
      imagesSrcToReplace : [],
      imagesSrcToHidePermanently : [
        ...(HIDE_OTHER_PLAYERS_AVATARS ? ['.square-avatar-wrapper > img'] : []),
        ...(HIDE_EVENT_GIRLS_AVATARS ? ['.girls-reward-container > .avatar'] : []),
      ],
      imagesToHideTemporarily : [],
    },
  },
  {
    name : 'SIDE QUESTS',
    slug : '/side-quests.html',
    selectors : {
      backgroundImagesSrcToHidePermanently : [],
      cssToModify : [],
      imagesSrcToReplace : [],
      imagesSrcToHidePermanently : ['.side-quest-image > img'],
      imagesToHideTemporarily : [],
    },
  },
  {
    name : 'TEAMS',
    slug : '/teams.html',
    selectors : {
      backgroundImagesSrcToHidePermanently : [],
      cssToModify : [],
      imagesSrcToReplace : [],
      imagesSrcToHidePermanently : ['.girl-image-container > img'],
      imagesToHideTemporarily : [],
    },
  },
  {
    name : 'TROLL BATTLE',
    slug : '/troll-battle.html',
    selectors : {
      backgroundImagesSrcToHidePermanently : [],
      cssToModify : [],
      imagesSrcToReplace : [],
      imagesSrcToHidePermanently : [
        ...(HIDE_OTHER_GIRLS_AVATARS ? ['.new-battle-girl-container > .avatar'] : []),
      ],
      imagesToHideTemporarily : [],
    },
  },
  {
    name : 'TROLL PRE-BATTLE',
    slug : '/troll-pre-battle.html',
    selectors : {
      backgroundImagesSrcToHidePermanently : [],
      cssToModify : [],
      imagesSrcToReplace : [],
      imagesSrcToHidePermanently : [],
      imagesToHideTemporarily : [],
    },
  },
  {
    name : 'WAIFU',
    slug : '/waifu.html',
    selectors : {
      backgroundImagesSrcToHidePermanently : [],
      cssToModify : [],
      imagesSrcToReplace : [],
      imagesSrcToHidePermanently : [
        ...(HIDE_OTHER_GIRLS_AVATARS ? ['.girl-display > .avatar'] : []),
      ],
      imagesToHideTemporarily : [],
    },
  },
  {
    name : 'WORLD',
    slug : '/world/',
    selectors : {
      backgroundImagesSrcToHidePermanently : [],
      cssToModify : [],
      imagesSrcToReplace : [],
      imagesSrcToHidePermanently : [
        ...(HIDE_EVENT_GIRLS_AVATARS ? ['.girl_world > .avatar'] : []),
        '.troll_world > .troll-tier-img',
      ],
      imagesToHideTemporarily : [],
    },
  },
  {
    name : 'WORLD BOSS BATTLE',
    slug : '/world-boss-battle.html',
    selectors : {
      backgroundImagesSrcToHidePermanently : [],
      cssToModify : [],
      imagesSrcToReplace : [],
      imagesSrcToHidePermanently : [
        ...(HIDE_OTHER_GIRLS_AVATARS ? ['.pvp-girls > .avatar'] : []),
      ],
      imagesToHideTemporarily : [],
    },
  },
  {
    name : 'WORLD BOSS EVENT',
    slug : '/world-boss-event',
    selectors : {
      backgroundImagesSrcToHidePermanently : [],
      cssToModify : [],
      imagesSrcToReplace : [],
      imagesSrcToHidePermanently : [
        ...(HIDE_OTHER_GIRLS_AVATARS ? [
          '.left-container > .avatar',
          '.right-container > .avatar',
        ] : []),
      ],
      imagesToHideTemporarily : [],
    },
  },
  {
    name : 'WORLD BOSS PRE-BATTLE',
    slug : '/world-boss-pre-battle',
    selectors : {
      backgroundImagesSrcToHidePermanently : [],
      cssToModify : [],
      imagesSrcToReplace : [],
      imagesSrcToHidePermanently : [],
      imagesToHideTemporarily : [],
    },
  },
];

// Pre-filter once at startup — only keep entries that match the current URL.
// The 'ALL' entry (empty slug) always matches. All others are tested against href.
const ACTIVE_PAGES = PAGE_LIST
  .filter(({slug}) => !slug || window.location.href.includes(slug))
  .map((page) => ({...page, values : page.values ?? DEFAULT_VALUES}));

/**
 * Injects a CSS rule hiding all matched selectors via the given CSS property.
 * Unified helper for both display:none and background-image:none cases.
 */
function injectCssHideRule(selectorsArray, cssProperty) {
  if (selectorsArray.length === 0) {
    return;
  }
  if (DEBUG_ACTIVATED) {
    console.log(`> INJECTING CSS HIDE RULE: ${cssProperty}`);
  }
  const style = document.createElement('style');
  style.textContent = `${selectorsArray.join(', ')} { ${cssProperty}: none !important; }\n`;
  document.head.prepend(style);
}

/**
 * Injects arbitrary CSS rules onto the given selectors.
 */
function modifyCssOfSelectors(selectorsArray, styleRules) {
  if (selectorsArray.length === 0) {
    return;
  }
  if (DEBUG_ACTIVATED) {
    console.log('> PROCESSING MODIFY CSS OF SELECTORS');
  }
  const style = document.createElement('style');
  style.textContent = `${selectorsArray.join(', ')} { ${styleRules.join(' !important; ')} !important; }\n`;
  document.head.prepend(style);
}

/**
 * Replaces the src of all matched elements with newSrc.
 */
function processImagesSrcToReplace(selectorsArray, newSrc) {
  if (selectorsArray.length === 0 || !newSrc) {
    return;
  }
  if (DEBUG_ACTIVATED) {
    console.log('> PROCESSING IMAGES SRC TO REPLACE');
  }
  const elements = document.querySelectorAll(selectorsArray.join(', '));
  if (DEBUG_ACTIVATED) {
    console.log('> nb of elements:', elements.length);
  }
  elements.forEach((element) => {
    if (element.src) {
      element.src = newSrc;
    }
  });
}

/**
 * Sets display style directly on matched elements.
 * Used for temporarily hiding (none) or showing again (block) elements.
 */
function setElementsDisplay(selectorsArray, displayValue) {
  if (selectorsArray.length === 0) {
    return;
  }
  if (DEBUG_ACTIVATED) {
    console.log(`> SETTING ELEMENTS DISPLAY: ${displayValue}`);
  }
  const elements = document.querySelectorAll(selectorsArray.join(', '));
  if (DEBUG_ACTIVATED) {
    console.log('> nb of elements:', elements.length);
  }
  elements.forEach((element) => {
    element.style.display = displayValue;
  });
}

/**
 * Increments the debug limit counter and disables debug logging once threshold is reached.
 */
function checkDebugLimit() {
  if (!DEBUG_LIMIT_ACTIVATED) {
    return;
  }
  debugLimitCount++;
  if (debugLimitCount > 3) {
    DEBUG_ACTIVATED = false;
  }
}

/**
 * Returns true if at least one user-controlled setting is enabled.
 * Used to short-circuit runAllHidingProcesses when everything is off.
 */
function isAnySettingEnabled() {
  return Object.values(HHSFW_DEFAULTS).some(Boolean);
}

/**
 * Unified page processing loop — runs all selectors for the current page.
 * ACTIVE_PAGES is pre-filtered at startup, so no slug-matching happens here.
 */
function runAllHidingProcesses() {
  ACTIVE_PAGES.forEach(({name, selectors, slug, values}) => {
    if (DEBUG_ACTIVATED) {
      console.log('> ')
      console.log(`> HIDING MEDIAS IN ${name} PAGE with SLUG: ${slug}`)
    }
    const {
      backgroundImagesSrcToHidePermanently,
      cssToModify,
      imagesSrcToHidePermanently,
      imagesSrcToReplace,
      imagesToHideTemporarily,
    } = selectors;

    // CSS injection — runs once only on the early call, before DOMContentLoaded
    if (!isCssInjected) {
      injectCssHideRule(backgroundImagesSrcToHidePermanently, 'background-image');
      injectCssHideRule(imagesSrcToHidePermanently, 'display');
      cssToModify.forEach((selectorGroup, i) => {
        modifyCssOfSelectors(selectorGroup, values.cssToModify[i]);
      });
    }

    // DOM manipulation — skipped on the early call, only runs after DOMContentLoaded
    if (isDOMReady) {
      processImagesSrcToReplace(imagesSrcToReplace, values.imagesSrcToReplace);
      setElementsDisplay(imagesToHideTemporarily, 'none');
    }
  });
}

/**
 * Unified page processing loop — runs all selectors for the current page.
 * ACTIVE_PAGES is pre-filtered at startup, so no slug-matching happens here.
 */
function runAllRevealingProcesses() {
  if (!isDOMReady) {
    return;
  }
  ACTIVE_PAGES.forEach(({ name, selectors, slug }) => {
    if (DEBUG_ACTIVATED) {
      console.log('> ');
      console.log(`> REVEALING MEDIAS IN ${name} PAGE with SLUG: ${slug}`);
    }
    setElementsDisplay(selectors.imagesToHideTemporarily, 'block');
  });
}

// Add event listener for clicks
document.addEventListener('click', function (event) {
  if (
    event.target.classList.contains('diamond') ||
    event.target.classList.contains('speech_bubble_info_icn') ||
    (event.target.parentElement &&
      event.target.parentElement.classList.contains('eye') &&
      window.location.href.includes('/quest/'))
  ) {
    if (DEBUG_ACTIVATED) {
      console.log('> ');
      console.log('> SPECIAL BUTTON CLICKED (IMG PROCESSING STOPPED)');
    }
    runAllRevealingProcesses();
  }
});

/**
 * Saves the current HHSFW_DEFAULTS state to localStorage.
 */
function saveHhsfwSettings() {
  try {
    localStorage.setItem('HHSFW.settings', JSON.stringify(HHSFW_DEFAULTS));
  } catch (e) {
    /* localStorage unavailable — skip silently */
  }
}

/**
 * Builds and injects the HHSFW settings panel and its toggle button into
 * #contains_all. Only runs on /home.html.
 *
 * The panel mirrors the style of #hhsOptions from the HHS script:
 * a tooltip div shown/hidden by clicking the logo image.
 */
function injectHhsButtonSibling() {
  // Only inject on the home page
  if (!window.location.href.includes('/home.html')) {
    return;
  }

  const container = document.getElementById('contains_all');
  if (!container) {
    if (DEBUG_ACTIVATED) {
      console.log('> #contains_all not found — not injecting HHSFW logo + settings panel');
    }
    return;
  }

  const ocdButton = document.getElementById('hhsButton');
  if (DEBUG_ACTIVATED) {
    console.log('> ocdButton:', ocdButton);
  }

  // Ensure the container is a positioning context
  if (window.getComputedStyle(container).position === 'static') {
    container.style.position = 'relative';
  }

  // ── Styles ────────────────────────────────────────────────────────────────
  // Media query breakpoints — mirrors OCD.js constants
  const mediaDesktop = '@media only screen and (min-width: 1026px)';
  const mediaMobile  = '@media only screen and (max-width: 1025px)';

  // Detect sibling scripts that affect layout, same way OCD.js does.
  // Store the element directly to avoid a second querySelector later.
  const hhPlusPlusButton = document.querySelector('.hh-plus-plus-config-button');
  const hasHhPlusPlusButton = hhPlusPlusButton !== null;

  // Detect OCD.js "customizedHomeScreen" setting from its localStorage key
  let customizedHomeScreen = false;
  try {
    customizedHomeScreen = localStorage.getItem('HHS.customizedHomeScreen') === 'true';
  } catch (e) {
    /* localStorage unavailable — keep false */
  }

  // Build the sheet-based dynamic stylesheet, mirroring every #hhsButton
  // rule from OCD.js 1-for-1, but targeting #hhsfwToggle instead.
  const dynamicStyle = document.createElement('style');
  document.head.appendChild(dynamicStyle);
  const sheet = dynamicStyle.sheet;

  // ── Base rule (always applied) ────────────────────────────────────────────
  // Mirrors: sheet.insertRule(`#hhsButton { height:35px; position:absolute;
  //   z-index:10; filter:drop-shadow(0px 0px 5px white); }`)
  sheet.insertRule(`#hhsfwToggle {
    height: 35px;
    position: absolute;
    z-index: 10;
    filter: drop-shadow(0px 0px 5px white);
    cursor: pointer;
  }`);

  // ── Positional rules — derived from sibling button positions at runtime ──────
  //
  // Priority order (mirrors the way OCD.js stacks its own buttons):
  //   1. ocdButton (#hhsButton) is present  → position relative to it
  //   2. .hh-plus-plus-config-button present → position relative to it
  //   3. Neither present                     → fall back to static CSS rules
  //
  // For cases 1 & 2 we read the sibling's computed position inside the shared
  // #contains_all container (which is already a positioning context at this
  // point) and apply inline styles directly on the img element.  Inline styles
  // are set after the img is appended to the DOM (see the positioning block
  // below the img creation).  We stash the reference and a flag here so the
  // later block knows what to do.

  let positionAnchor = null; // Element whose position we'll mirror
  let useStaticCss   = false;

  if (ocdButton) {
    // Case 1: OCD.js button is in the DOM — anchor to it
    positionAnchor = ocdButton;
    if (DEBUG_ACTIVATED) {
      console.log('> [HHSFW] positioning relative to #hhsButton');
    }
  } else if (hasHhPlusPlusButton) {
    // Case 2: HH++ button is in the DOM — anchor to it
    positionAnchor = hhPlusPlusButton;
    if (DEBUG_ACTIVATED) {
      console.log('> [HHSFW] positioning relative to .hh-plus-plus-config-button');
    }
  } else {
    // Case 3: no sibling buttons found — use static responsive CSS
    useStaticCss = true;
    if (DEBUG_ACTIVATED) {
      console.log('> [HHSFW] no sibling button found — using static CSS fallback');
    }
  }

  if (useStaticCss) {
    // Static fallback — mirrors the OCD.js rules for the no-sibling-button case
    if (customizedHomeScreen) {
      // OCD branch: NO .hh-plus-plus-config-button AND customizedHomeScreen ON
      sheet.insertRule(`${mediaDesktop} {
        #hhsfwToggle {
          right: 42px;
          top: 100px;
        }
      }`);
      sheet.insertRule(`${mediaMobile} {
        #hhsfwToggle {
          right: 125px;
          top: 85px;
        }
      }`);
    } else {
      // OCD branch: NO .hh-plus-plus-config-button AND customizedHomeScreen OFF
      sheet.insertRule(`${mediaDesktop} {
        #hhsfwToggle {
          right: 42px;
          top: 90px;
        }
      }`);
      sheet.insertRule(`${mediaMobile} {
        #hhsfwToggle {
          right: 130px;
          top: 85px;
        }
      }`);
    }
  }

  // ── Static panel + UI styles (unchanged) ─────────────────────────────────
  const style = document.createElement('style');
  style.textContent = `
    #hhsfwPanel {
      display: none;
      position: absolute;
      z-index: 100;
      background: #1a1a2e;
      border: 1px solid #e91e8c;
      border-radius: 8px;
      padding: 14px 18px 10px;
      min-width: 280px;
      box-shadow: 0 4px 24px rgba(0,0,0,0.7);
      font-family: Arial, sans-serif;
      font-size: 13px;
      color: #f0f0f0;
    }
    #hhsfwPanel .hhsfw-title {
      font-weight: bold;
      font-size: 14px;
      color: #e91e8c;
      margin-bottom: 10px;
      display: flex;
      justify-content: space-between;
      align-items: center;
    }
    #hhsfwPanel .hhsfw-close {
      cursor: pointer;
      font-size: 16px;
      color: #aaa;
      line-height: 1;
    }
    #hhsfwPanel .hhsfw-close:hover { color: #fff; }
    #hhsfwPanel .script_setting {
      display: flex;
      flex-direction: row;
      align-items: center;
      gap: 10px;
      margin-bottom: 8px;
    }
    #hhsfwPanel .script_setting span {
      display: flex;
      align-items: center;
      line-height: 1;
    }
    #hhsfwPanel .switch {
      position: relative;
      display: inline-block;
      width: 36px;
      height: 20px;
      min-width: 36px;
      min-height: 20px;
      flex-shrink: 0;
      top: 0px;
    }
    #hhsfwPanel .switch input { opacity: 0; width: 0; height: 0; }
    #hhsfwPanel .slider {
      position: absolute;
      cursor: pointer;
      inset: 0;
      background: #444;
      border-radius: 20px;
      transition: background 0.2s;
      margin-right: 0px;
    }
    #hhsfwPanel .slider:before {
      content: '';
      position: absolute;
      width: 14px;
      height: 14px;
      left: 3px;
      bottom: 3px;
      background: #fff;
      border-radius: 50%;
      transition: transform 0.2s;
    }
    #hhsfwPanel .switch input:checked + .slider { background: #e91e8c; }
    #hhsfwPanel .switch input:checked + .slider:before { transform: translateX(16px); }
    #hhsfwPanel .hhsfw-note {
      font-size: 11px;
      color: #888;
      margin-top: 8px;
      border-top: 1px solid #333;
      padding-top: 6px;
    }
  `;
  document.head.appendChild(style);

  // ── Settings panel ────────────────────────────────────────────────────────
  const panel = document.createElement('div');
  panel.id = 'hhsfwPanel';
  panel.innerHTML = `
    <div class="hhsfw-title">
      Hentai Heroes SFW
      <span class="hhsfw-close" id="hhsfwClose">✕</span>
    </div>
    <div class="script_setting">
      <label class="switch">
        <input type="checkbox" id="hhsfw-HIDE_EVENT_GIRLS_AVATARS" ${HHSFW_DEFAULTS.HIDE_EVENT_GIRLS_AVATARS ? 'checked' : ''}>
        <span class="slider"></span>
      </label>
      <span>Hide event girls' avatars</span>
    </div>
    <div class="script_setting">
      <label class="switch">
        <input type="checkbox" id="hhsfw-HIDE_HAREM_SELECTED_GIRL_AVATAR" ${HHSFW_DEFAULTS.HIDE_HAREM_SELECTED_GIRL_AVATAR ? 'checked' : ''}>
        <span class="slider"></span>
      </label>
      <span>Hide harem selected girl avatar</span>
    </div>
    <div class="script_setting">
      <label class="switch">
        <input type="checkbox" id="hhsfw-HIDE_OTHER_GIRLS_AVATARS" ${HHSFW_DEFAULTS.HIDE_OTHER_GIRLS_AVATARS ? 'checked' : ''}>
        <span class="slider"></span>
      </label>
      <span>Hide other girls' avatars</span>
    </div>
    <div class="script_setting">
      <label class="switch">
        <input type="checkbox" id="hhsfw-HIDE_OTHER_PLAYERS_AVATARS" ${HHSFW_DEFAULTS.HIDE_OTHER_PLAYERS_AVATARS ? 'checked' : ''}>
        <span class="slider"></span>
      </label>
      <span>Hide other players' avatars</span>
    </div>
    <div class="script_setting">
      <label class="switch">
        <input type="checkbox" id="hhsfw-HIDE_VIDEO_PREVIEWS" ${HHSFW_DEFAULTS.HIDE_VIDEO_PREVIEWS ? 'checked' : ''}>
        <span class="slider"></span>
      </label>
      <span>Hide video previews</span>
    </div>
    <div class="script_setting">
      <label class="switch">
        <input type="checkbox" id="hhsfw-REPLACE_BACKGROUND" ${HHSFW_DEFAULTS.REPLACE_BACKGROUND ? 'checked' : ''}>
        <span class="slider"></span>
      </label>
      <span>Change background to SFW one</span>
    </div>
    <div class="hhsfw-note">Changes take effect on next page load.</div>
  `;
  container.appendChild(panel);
  // Set the initial display via inline style so the toggle handler's
  // panel.style.display check always compares against a known inline value.
  // Without this, style.display starts as '' (empty) even though the CSS rule
  // says display:none — causing the first click to set it to 'none' instead of 'block'.
  panel.style.display = 'none';

  // ── Toggle button (logo image) ────────────────────────────────────────────
  const img = document.createElement('img');
  img.id = 'hhsfwToggle';
  img.src = isAnySettingEnabled() ? 'https://i.postimg.cc/d3QRs43j/SFW_logo.png' : 'https://i.postimg.cc/7hP1HmhM/NSFW_logo.png';
  img.title = 'HHSFW Settings';
  container.appendChild(img);

  // ── Anchor-based inline positioning (cases 1 & 2) ────────────────────────
  // offsetTop / offsetLeft are already relative to offsetParent, which is
  // #contains_all (a positioned element) — so they map directly to the
  // `top` / `left` values needed for `position: absolute` without any rect
  // arithmetic.  `right` is derived as containerWidth - anchorLeft - anchorWidth
  // then shifted 40px further left.
  if (positionAnchor) {
    const anchorTop      = positionAnchor.offsetTop;
    const anchorLeft     = positionAnchor.offsetLeft;
    const anchorWidth    = positionAnchor.offsetWidth;
    const containerWidth = container.offsetWidth;

    // Convert the anchor's left edge to a `right` value, then shift 40px left
    const anchorRight = containerWidth - anchorLeft - anchorWidth;

    const topOffset = hasHhPlusPlusButton && !ocdButton ? 70 : 0;
    const rightOffset = ocdButton ? 70 : 0;
    img.style.top   = `${anchorTop + topOffset}px`;
    img.style.right = `${anchorRight + rightOffset}px`;
  }

  // ── Event listeners ───────────────────────────────────────────────────────
  img.addEventListener('click', function () {
    if (panel.style.display === 'none') {
      // Measure panel width before showing it
      panel.style.visibility = 'hidden';
      panel.style.display = 'block';

      // img.offsetTop/offsetLeft are already relative to #contains_all
      // (the nearest positioned ancestor), so they map directly to
      // `top`/`left` values for `position: absolute` inside that container.
      // Bottom of toggle = offsetTop + offsetHeight
      // Left of panel so its right edge aligns with toggle's left edge:
      //   panelLeft = img.offsetLeft - panel.offsetWidth
      const panelTop  = img.offsetTop  + img.offsetHeight;
      const panelLeft = img.offsetLeft - panel.offsetWidth;

      panel.style.top   = panelTop  + 'px';
      panel.style.left  = panelLeft + 'px';
      panel.style.right = '';

      panel.style.visibility = '';
    } else {
      panel.style.display = 'none';
    }
  });

  document.getElementById('hhsfwClose').addEventListener('click', function () {
    panel.style.display = 'none';
  });

  [
    'HIDE_EVENT_GIRLS_AVATARS',
    'HIDE_HAREM_SELECTED_GIRL_AVATAR',
    'HIDE_OTHER_GIRLS_AVATARS',
    'HIDE_OTHER_PLAYERS_AVATARS',
    'HIDE_VIDEO_PREVIEWS',
    'REPLACE_BACKGROUND'
  ].forEach(function (key) {
    document.getElementById('hhsfw-' + key).addEventListener('change', function (e) {
      HHSFW_DEFAULTS[key] = e.target.checked;
      saveHhsfwSettings();
    });
  });
}

// DOM is ready, resources may still be loading.
// Set isDOMReady so that processImagesSrcToReplace and setElementsDisplay are now allowed to run.
// CSS injection is skipped on this second call (isCssInjected is already true).
document.addEventListener('DOMContentLoaded', function () {
  if (DEBUG_ACTIVATED) {
    console.log('> ');
    console.log('> DOMContentLoaded');
  }

  if (isAnySettingEnabled()) {
    isDOMReady = true;
    runAllHidingProcesses();
  }
});

// All resources (including images) have fully loaded — safe to query elements
// that are injected late by the game. This is the last event in the page
// loading lifecycle, fired after DOMContentLoaded and all sub-resources.
window.addEventListener('load', function () {
  if (DEBUG_ACTIVATED) {
    console.log('> ');
    console.log('> window load');
  }

  // Delay so sibling scripts (OCD.js, HH++) have time to inject their
  // own buttons into the DOM before we read their positions.
  setTimeout(function () {
    injectHhsButtonSibling();
  }, 600);
});

// Run immediately at script start — CSS injection only (isDOMReady is false, DOM manipulation is skipped)
if (isAnySettingEnabled()) {
  checkDebugLimit();
  runAllHidingProcesses();
  isCssInjected = true;
}
