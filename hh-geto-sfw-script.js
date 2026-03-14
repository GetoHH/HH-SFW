// ==UserScript==
// @name         Hentai Heroes SFW
// @namespace    https://sleazyfork.org/fr/scripts/539097-hentai-heroes-sfw
// @description  Removing explicit images in Hentai Heroes game and changing game background to a SFW one.
// @version      3.5.0
// @match        https://*.hentaiheroes.com/*
// @run-at       document-start
// @grant        none
// @author       Geto_hh
// @license      MIT
// ==/UserScript==

// ==CHANGELOG==
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

const HIDE_BACKGROUND    = false;
const HIDE_GIRL_AVATARS  = true;
const HIDE_PLAYER_AVATARS = true;
const REPLACE_BACKGROUND = true;

/**
 * VARIABLES
 */
// let is required — DEBUG_ACTIVATED is reassigned to false inside checkDebugLimit()
let DEBUG_ACTIVATED = false; // eslint-disable-line no-var
let debugLimitCount = 0;
let isCssInjected = false;
let isDOMReady = false;

/**
 * CONSTANTS
 */
const NEW_BACKGROUND_URL =
  'https://hh2.hh-content.com/pictures/gallery/6/2200x/401-a8339a2168753900db437d91f2ed39ff.jpg';

// Pre-evaluated once — avoids repeating the same conditional spread across every page entry
const PLAYER_AVATAR_SELECTORS = HIDE_PLAYER_AVATARS ? ['.player-profile-picture > img'] : [];
const BACKGROUND_SELECTORS    = HIDE_BACKGROUND     ? ['.fixed_scaled > img']           : [];

// Default values object — used as fallback for pages that don't define custom values
const DEFAULT_VALUES = { cssToModify : [], imagesSrcToReplace : [] };

const PAGE_LIST = [
  {
    name : 'ALL',
    slug : '',
    selectors : {
      backgroundImagesSrcToHidePermanently : [
        '.bundle > #special-offer',
        '.bundle > #starter-offer',
        '.mc-card-container > .rewards-container',
        '.product-offer-container > .product-offer-background-container',
      ],
      cssToModify : [],
      imagesSrcToReplace : [
        ...((REPLACE_BACKGROUND && !HIDE_BACKGROUND) ? ['.fixed_scaled > img'] : []),
      ],
      imagesSrcToHidePermanently : [
        ...PLAYER_AVATAR_SELECTORS,
        '.intro > .quest-container > #scene > .canvas > .picture',
        '.background_image-style > img',
        '#no_energy_popup > .avatar',
        '.info-top-block > .bunny-rotate-device',
        '.container > .avatar',
        '.prestige > .avatar',
        '#special-offer > .background-video',
        '.pwa-info-container > .install_app_girl',
        ...(HIDE_GIRL_AVATARS ? [
          '.avatar-box > .avatar',
          '.awakening-container > .avatar',
          // '.girl-avatar-wrapper > .avatar',
          // '.girl-skills-avatar > .avatar',
        ] : []),
        '.lively_scene > img',
      ],
      imagesToHideTemporarily : [],
    },
    values : {
      cssToModify : [],
      imagesSrcToReplace : NEW_BACKGROUND_URL,
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
        ...PLAYER_AVATAR_SELECTORS,
        ...BACKGROUND_SELECTORS,
        '.mission_image > img',
        '.pop_thumb > img',
        '.pop-details-left > img',
        '.pop_girl_avatar > img',
        '.pop-record > .pop-record-bg',
        '.timer-girl-container > img',
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
      imagesSrcToHidePermanently : [
        ...PLAYER_AVATAR_SELECTORS,
        ...BACKGROUND_SELECTORS,
      ],
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
      ],
      imagesSrcToReplace : [],
      imagesSrcToHidePermanently : [
        ...PLAYER_AVATAR_SELECTORS,
        ...BACKGROUND_SELECTORS,
        '.champions-animation > .avatar',
        '.champions-animation > .champions-over__champion-image',
        '.defender-preview > img',
        '.attacker-preview > .character',
        '.rounds-info__figures > .figure',
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
        ...(HIDE_GIRL_AVATARS ? [
          '.avatar-box > .avatar',
          '.awakening-container > .avatar',
        ] : []),
        '.lively_scene > img',
      ],
      imagesToHideTemporarily : [],
    },
  },
  {
    name : 'CLUB CHAMPION',
    slug : '/club-champion.html',
    selectors : {
      backgroundImagesSrcToHidePermanently : [],
      cssToModify : [],
      imagesSrcToReplace : [],
      imagesSrcToHidePermanently : [
        ...PLAYER_AVATAR_SELECTORS,
        ...BACKGROUND_SELECTORS,
        '.figure',
        '.girl-fav-position > .favorite-position',
        '.girl-card > .fav-position',
        ...(HIDE_GIRL_AVATARS ? [
          '.champions-over__champion-wrapper > .avatar',
        ] : []),
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
        ...(HIDE_GIRL_AVATARS ? ['.girl-display > .avatar'] : []),
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
        ...(HIDE_GIRL_AVATARS ? ['.girl-display > .avatar'] : []),
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
        ...(HIDE_GIRL_AVATARS ? ['.girl-display > .avatar'] : []),
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
        ...PLAYER_AVATAR_SELECTORS,
        ...BACKGROUND_SELECTORS,
        '.sm-static-girl > img',
        '.lse_puzzle_wrapper > .lively_scene_image',
        '.lively_scenes_preview > div > img',
        ...(HIDE_GIRL_AVATARS ? ['.column-girl > img', '.girls-container > .avatar', '.right-container > .avatar', '.slide > .avatar', '.lse_girl_container > .avatar'] : []),
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
        ...(HIDE_GIRL_AVATARS ? [
          '.team-slot-container > img',
          '.awakening-container > .avatar',
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
        ...(HIDE_GIRL_AVATARS ? ['.feature-girl > .avatar'] : []),
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
        ...(HIDE_GIRL_AVATARS ? [
          '.avatar-box > .avatar',
          '.awakening-container > .avatar',
        ] : []),
        '.lively_scene > img',
      ],
      imagesToHideTemporarily : [],
    },
  },
  {
    name : 'HOME',
    slug : '/home.html',
    selectors : {
      backgroundImagesSrcToHidePermanently : [
        '#crosspromo_show_ad > .crosspromo_banner',
        '#special-offer',
        '.news_page_content > .news_page_pic',
        '.news_thumb > .news_thumb_pic',
      ],
      cssToModify : [],
      imagesSrcToReplace : ['.fixed_scaled > img'],
      imagesSrcToHidePermanently : [
        ...(HIDE_GIRL_AVATARS ? ['.waifu-container > .avatar'] : []),
        ...PLAYER_AVATAR_SELECTORS,
        ...BACKGROUND_SELECTORS,
        '.info-top-block > .bunny-rotate-device',
        '.pwa-info-container > .install_app_girl',
      ],
      imagesToHideTemporarily : [],
    },
    values : {
      cssToModify : [],
      imagesSrcToReplace : [NEW_BACKGROUND_URL],
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
        ...(HIDE_GIRL_AVATARS ? [
          '.shop-labyrinth-girl > .avatar',
          '.labyrinth-girl > .avatar',
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
        ...(HIDE_GIRL_AVATARS ? [
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
        ...(HIDE_GIRL_AVATARS ? ['.labyrinth-girl > .avatar'] : []),
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
      imagesSrcToHidePermanently : [
        ...PLAYER_AVATAR_SELECTORS,
        ...BACKGROUND_SELECTORS,
      ],
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
        ...(HIDE_GIRL_AVATARS ? ['.labyrinth-girl > .avatar'] : []),
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
        ...(HIDE_GIRL_AVATARS ? ['.girl-block > .avatar'] : []),
        ...(HIDE_PLAYER_AVATARS ? ['.square-avatar-wrapper > img', '.player-profile-picture > img'] : []),
        ...BACKGROUND_SELECTORS,
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
        ...(HIDE_GIRL_AVATARS ? ['.new-battle-girl-container > .avatar'] : []),
        ...PLAYER_AVATAR_SELECTORS,
        ...BACKGROUND_SELECTORS,
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
        ...(HIDE_GIRL_AVATARS ? ['.girl-block > .avatar'] : []),
        ...PLAYER_AVATAR_SELECTORS,
        ...BACKGROUND_SELECTORS,
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
        ...(HIDE_GIRL_AVATARS ? [
          '.left-girl-container > .avatar',
          '.left-girl-container > .girl-img',
          '.right-girl-container > .avatar',
          '.right-girl-container > .girl-img',
        ] : []),
        ...PLAYER_AVATAR_SELECTORS,
        ...BACKGROUND_SELECTORS,
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
        ...PLAYER_AVATAR_SELECTORS,
        ...BACKGROUND_SELECTORS,
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
        ...(HIDE_GIRL_AVATARS ? ['.girl-container > .avatar'] : []),
        ...PLAYER_AVATAR_SELECTORS,
        ...BACKGROUND_SELECTORS,
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
        ...(HIDE_GIRL_AVATARS ? ['.new-battle-girl-container > .avatar'] : []),
        ...PLAYER_AVATAR_SELECTORS,
        ...BACKGROUND_SELECTORS,
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
        ...(HIDE_GIRL_AVATARS ? [
          '.left_side > .avatar',
          '.right_side > .avatar',
        ] : []),
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
        ...(HIDE_GIRL_AVATARS ? [
          '.left_side > .avatar',
          '.right_side > .avatar',
        ] : []),
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
        ...(HIDE_GIRL_AVATARS ? ['.girl_block > .avatar'] : []),
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
        ...(HIDE_GIRL_AVATARS ? ['.girl_block > .avatar'] : []),
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
        ...(HIDE_GIRL_AVATARS ? ['.pvp-girls > .avatar'] : []),
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
        ...(HIDE_GIRL_AVATARS ? ['.feature-girl > .avatar'] : []),
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
        ...(HIDE_GIRL_AVATARS ? ['.girl_block > .avatar'] : []),
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
      imagesSrcToHidePermanently : [
        ...PLAYER_AVATAR_SELECTORS,
        ...BACKGROUND_SELECTORS,
      ],
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
        ...(HIDE_GIRL_AVATARS ? ['.new-battle-girl-container > .avatar'] : []),
        ...PLAYER_AVATAR_SELECTORS,
        ...BACKGROUND_SELECTORS,
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
        ...(HIDE_GIRL_AVATARS ? ['.girls-reward-container > .avatar'] : []),
        '.lively_scene > img',
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
        ...(HIDE_GIRL_AVATARS ? ['.new-battle-girl-container > .avatar'] : []),
        ...PLAYER_AVATAR_SELECTORS,
        ...BACKGROUND_SELECTORS,
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
      imagesSrcToHidePermanently : [
        ...PLAYER_AVATAR_SELECTORS,
        ...BACKGROUND_SELECTORS,
      ],
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
        ...(HIDE_GIRL_AVATARS ? ['.girl-display > .avatar'] : []),
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
        ...(HIDE_GIRL_AVATARS ? ['.girl_world > .avatar'] : []),
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
        ...(HIDE_GIRL_AVATARS ? ['.pvp-girls > .avatar'] : []),
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
        ...(HIDE_GIRL_AVATARS ? [
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
  .filter(({ slug }) => !slug || window.location.href.includes(slug))
  .map((page) => ({ ...page, values : page.values ?? DEFAULT_VALUES }));

/**
 * Injects a CSS rule hiding all matched selectors via the given CSS property.
 * Unified helper for both display:none and background-image:none cases.
 */
function injectCssHideRule(selectorsArray, cssProperty) {
  if (selectorsArray.length === 0) return;
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
  if (selectorsArray.length === 0) return;
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
  if (selectorsArray.length === 0 || !newSrc) return;
  if (DEBUG_ACTIVATED) {
    console.log('> PROCESSING IMAGES SRC TO REPLACE');
  }
  const elements = document.querySelectorAll(selectorsArray.join(', '));
  if (DEBUG_ACTIVATED) {
    console.log('> nb of elements:', elements.length);
  }
  let nbOfElementsProcessed = 0;
  elements.forEach((element) => {
    if (element && element.src) {
      element.src = newSrc;
      nbOfElementsProcessed++;
    }
  });
  if (DEBUG_ACTIVATED) {
    console.log('> nb of elements processed:', nbOfElementsProcessed);
  }
}

/**
 * Sets display style directly on matched elements.
 * Used for temporarily hiding (none) or showing again (block) elements.
 */
function setElementsDisplay(selectorsArray, displayValue) {
  if (selectorsArray.length === 0) return;
  if (DEBUG_ACTIVATED) {
    console.log(`> SETTING ELEMENTS DISPLAY: ${displayValue}`);
  }
  //TODO improve with style
  const elements = document.querySelectorAll(selectorsArray.join(', '));
  if (DEBUG_ACTIVATED) {
    console.log('> nb of elements:', elements.length);
  }
  let nbOfElementsProcessed = 0;
  elements.forEach((element) => {
    if (element) {
      element.style.display = displayValue;
      nbOfElementsProcessed++;
    }
  });
  if (DEBUG_ACTIVATED) {
    console.log('> nb of elements processed:', nbOfElementsProcessed);
  }
}

/**
 * Increments the debug limit counter and disables debug logging once threshold is reached.
 */
function checkDebugLimit() {
  if (!DEBUG_LIMIT_ACTIVATED) return;
  debugLimitCount++;
  if (debugLimitCount > 3) {
    DEBUG_ACTIVATED = false;
  }
}

/**
 * Unified page processing loop — runs all selectors for the current page.
 * ACTIVE_PAGES is pre-filtered at startup, so no slug-matching happens here.
 */
function runAllProcesses() {
  ACTIVE_PAGES.forEach(({ name, selectors, slug, values }) => {
    if (DEBUG_ACTIVATED) {
      console.log('> ')
      console.log(`> PROCESSING ${name} PAGE with SLUG: ${slug}`)
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
    if (window.location.href.includes('/quest/')) {
      setElementsDisplay(['.canvas > .picture'], 'block');
    }
  }
});

// DOM is ready, resources may still be loading.
// Set isDOMReady so that processImagesSrcToReplace and setElementsDisplay are now allowed to run.
// CSS injection is skipped on this second call (isCssInjected is already true).
document.addEventListener('DOMContentLoaded', function () {
  if (DEBUG_ACTIVATED) {
    console.log('> ');
    console.log('> DOMContentLoaded');
  }
  isDOMReady = true;
  runAllProcesses();
});

// Run immediately at script start — CSS injection only (isDOMReady is false, DOM manipulation is skipped)
checkDebugLimit();
runAllProcesses();
isCssInjected = true;
