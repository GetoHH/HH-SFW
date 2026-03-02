// ==UserScript==
// @name         Hentai Heroes SFW
// @namespace    https://sleazyfork.org/fr/scripts/539097-hentai-heroes-sfw
// @description  Removing explicit images in Hentai Heroes game and setting all girls / champions poses to the default one.
// @version      3.1.1
// @match        https://*.comixharem.com/*
// @match        https://*.hentaiheroes.com/*
// @match        https://*.pornstarharem.com/*
// @run-at       document-start
// @grant        none
// @author       Geto_hh
// @license      MIT
// ==/UserScript==

// ==CHANGELOG==
// 3.1.1: Remove unnecessary spreads
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
let DEBUG_ACTIVATED = false;
const DEBUG_LIMIT_ACTIVATED = false;

const HIDE_BACKGROUND = false;
const HIDE_GIRL_AVATARS = true;
const HIDE_PLAYER_AVATARS = true;
const REPLACE_BACKGROUND = true;

/**
 * VARIABLES
 */
let debugHideLimitCount = 0;
let debugHideTemporarilyLimitCount = 0;

/**
 * CONSTANTS
 */
const DEFAULT_BACKGROUND_URL =
  'https://hh2.hh-content.com/pictures/gallery/6/2200x/9c04e3d2df8d992146eea132225d2d54.jpg';

const NEW_BACKGROUNG_URL =
  'https://hh2.hh-content.com/pictures/gallery/6/2200x/401-a8339a2168753900db437d91f2ed39ff.jpg';

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
        ...(HIDE_PLAYER_AVATARS ? ['.player-profile-picture > img'] : []),
        '.intro > .quest-container > #scene > .canvas > .picture',
        '.background_image-style > img',
        '#no_energy_popup > .avatar',
        '.info-top-block > .bunny-rotate-device',
        '.container > .avatar',
        '.prestige > .avatar',
        '#special-offer > .background-video',
        '.pwa-info-container > .install_app_girl',
      ],
      imagesToHideTemporarily : [],
    },
    values : {
      cssToModify : [],
      imagesSrcToReplace : NEW_BACKGROUNG_URL,
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
        ...(HIDE_PLAYER_AVATARS ? ['.player-profile-picture > img'] : []),
        ...(HIDE_BACKGROUND ? ['.fixed_scaled > img'] : []),
        '.mission_image > img',
        '.pop_thumb > img',
        '.pop-details-left > img',
        '.pop_girl_avatar > img',
        '.pop-record > .pop-record-bg',
        '.timer-girl-container > img',
      ],
      imagesToHideTemporarily : [],
    },
    values : {
      cssToModify : [],
      imagesSrcToReplace : [],
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
        ...(HIDE_PLAYER_AVATARS ? ['.player-profile-picture > img'] : []),
        ...(HIDE_BACKGROUND ? ['.fixed_scaled > img'] : []),
      ],
      imagesToHideTemporarily : [],
    },
    values : {
      cssToModify : [],
      imagesSrcToReplace : [],
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
        ...(HIDE_PLAYER_AVATARS ? ['.player-profile-picture > img'] : []),
        ...(HIDE_BACKGROUND ? ['.fixed_scaled > img'] : []),
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
    values : {
      cssToModify : [],
      imagesSrcToReplace : [],
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
        ...(HIDE_PLAYER_AVATARS ? ['.player-profile-picture > img'] : []),
        ...(HIDE_BACKGROUND ? ['.fixed_scaled > img'] : []),
        '.figure',
        '.girl-fav-position > .favorite-position',
        '.girl-card > .fav-position',
        ...(HIDE_GIRL_AVATARS ? [
          '.champions-over__champion-wrapper > .avatar',
        ] : []),
      ],
      imagesToHideTemporarily : [],
    },
    values : {
      cssToModify : [],
      imagesSrcToReplace : [],
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
    values : {
      cssToModify : [],
      imagesSrcToReplace : [],
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
    values : {
      cssToModify : [],
      imagesSrcToReplace : [],
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
    values : {
      cssToModify : [],
      imagesSrcToReplace : [],
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
        ...(HIDE_PLAYER_AVATARS ? ['.player-profile-picture > img'] : []),
        ...(HIDE_BACKGROUND ? ['.fixed_scaled > img'] : []),
        '.sm-static-girl > img',
        '.lse_puzzle_wrapper > .lively_scene_image',
        '.lively_scenes_preview > div > img',
        ...(HIDE_GIRL_AVATARS ? ['.column-girl > img', '.girls-container > .avatar', '.right-container > .avatar', '.slide > .avatar'] : []),
      ],
      imagesToHideTemporarily : [],
    },
    values : {
      cssToModify : [],
      imagesSrcToReplace : [],
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
        ...(HIDE_GIRL_AVATARS ? ['.team-slot-container > img',
          '.awakening-container > .avatar',
        ] : []),
      ],
      imagesToHideTemporarily : [],
    },
    values : {
      cssToModify : [],
      imagesSrcToReplace : [],
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
    values : {
      cssToModify : [],
      imagesSrcToReplace : [],
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
        ...(HIDE_PLAYER_AVATARS ? ['.player-profile-picture > img'] : []),
        ...(HIDE_BACKGROUND ? ['.fixed_scaled > img'] : []),
        '.info-top-block > .bunny-rotate-device',
        '.pwa-info-container > .install_app_girl',
      ],
      imagesToHideTemporarily : [],
    },
    values : {
      cssToModify : [],
      imagesSrcToReplace : [NEW_BACKGROUNG_URL],
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
    values : {
      cssToModify : [],
      imagesSrcToReplace : [],
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
    values : {
      cssToModify : [],
      imagesSrcToReplace : [],
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
    values : {
      cssToModify : [],
      imagesSrcToReplace : [],
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
        ...(HIDE_PLAYER_AVATARS ? ['.player-profile-picture > img'] : []),
        ...(HIDE_BACKGROUND ? ['.fixed_scaled > img'] : []),
      ],
      imagesToHideTemporarily : [],
    },
    values : {
      cssToModify : [],
      imagesSrcToReplace : [],
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
    values : {
      cssToModify : [],
      imagesSrcToReplace : [],
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
        ...(HIDE_BACKGROUND ? ['.fixed_scaled > img'] : []),
        '.tier_icons > img',
      ],
      imagesToHideTemporarily : [],
    },
    values : {
      cssToModify : [],
      imagesSrcToReplace : [],
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
        ...(HIDE_PLAYER_AVATARS ? ['.player-profile-picture > img'] : []),
        ...(HIDE_BACKGROUND ? ['.fixed_scaled > img'] : []),
      ],
      imagesToHideTemporarily : [],
    },
    values : {
      cssToModify : [],
      imagesSrcToReplace : [],
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
        ...(HIDE_PLAYER_AVATARS ? ['.player-profile-picture > img'] : []),
        ...(HIDE_BACKGROUND ? ['.fixed_scaled > img'] : []),
      ],
      imagesToHideTemporarily : [],
    },
    values : {
      cssToModify : [],
      imagesSrcToReplace : [],
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
        ...(HIDE_PLAYER_AVATARS ? ['.player-profile-picture > img'] : []),
        ...(HIDE_BACKGROUND ? ['.fixed_scaled > img'] : []),
      ],
      imagesToHideTemporarily : [],
    },
    values : {
      cssToModify : [],
      imagesSrcToReplace : [],
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
    values : {
      cssToModify : [],
      imagesSrcToReplace : [],
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
        ...(HIDE_PLAYER_AVATARS ? ['.player-profile-picture > img'] : []),
        ...(HIDE_BACKGROUND ? ['.fixed_scaled > img'] : []),
        '.pachinko_img > img',
      ],
      imagesToHideTemporarily : [],
    },
    values : {
      cssToModify : [],
      imagesSrcToReplace : [],
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
        ...(HIDE_PLAYER_AVATARS ? ['.player-profile-picture > img'] : []),
        ...(HIDE_BACKGROUND ? ['.fixed_scaled > img'] : []),
        '.pantheon_bgr > .stage-bgr',
      ],
      imagesToHideTemporarily : [],
    },
    values : {
      cssToModify : [],
      imagesSrcToReplace : [],
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
        ...(HIDE_PLAYER_AVATARS ? ['.player-profile-picture > img'] : []),
        ...(HIDE_BACKGROUND ? ['.fixed_scaled > img'] : []),
      ],
      imagesToHideTemporarily : [],
    },
    values : {
      cssToModify : [],
      imagesSrcToReplace : [],
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
    values : {
      cssToModify : [],
      imagesSrcToReplace : [],
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
    values : {
      cssToModify : [],
      imagesSrcToReplace : [],
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
    values : {
      cssToModify : [],
      imagesSrcToReplace : [],
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
    values : {
      cssToModify : [],
      imagesSrcToReplace : [],
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
    values : {
      cssToModify : [],
      imagesSrcToReplace : [],
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
    values : {
      cssToModify : [],
      imagesSrcToReplace : [],
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
    values : {
      cssToModify : [],
      imagesSrcToReplace : [],
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
    }
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
    values : {
      cssToModify : [],
      imagesSrcToReplace : [],
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
        ...(HIDE_PLAYER_AVATARS ? ['.player-profile-picture > img'] : []),
        ...(HIDE_BACKGROUND ? ['.fixed_scaled > img'] : []),
      ],
      imagesToHideTemporarily : [],
    },
    values : {
      cssToModify : [],
      imagesSrcToReplace : [],
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
        ...(HIDE_PLAYER_AVATARS ? ['.player-profile-picture > img'] : []),
        ...(HIDE_BACKGROUND ? ['.fixed_scaled > img'] : []),
      ],
      imagesToHideTemporarily : [],
    },
    values : {
      cssToModify : [],
      imagesSrcToReplace : [],
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
    values : {
      cssToModify : [],
      imagesSrcToReplace : [],
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
    values : {
      cssToModify : [],
      imagesSrcToReplace : [],
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
    values : {
      cssToModify : [],
      imagesSrcToReplace : [],
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
        ...(HIDE_PLAYER_AVATARS ? ['.player-profile-picture > img'] : []),
        ...(HIDE_BACKGROUND ? ['.fixed_scaled > img'] : []),
      ],
      imagesToHideTemporarily : [],
    },
    values : {
      cssToModify : [],
      imagesSrcToReplace : [],
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
        ...(HIDE_PLAYER_AVATARS ? ['.player-profile-picture > img'] : []),
        ...(HIDE_BACKGROUND ? ['.fixed_scaled > img'] : []),
      ],
      imagesToHideTemporarily : [],
    },
    values : {
      cssToModify : [],
      imagesSrcToReplace : [],
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
    values : {
      cssToModify : [],
      imagesSrcToReplace : [],
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
    values : {
      cssToModify : [],
      imagesSrcToReplace : [],
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
    values : {
      cssToModify : [],
      imagesSrcToReplace : [],
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
    values : {
      cssToModify : [],
      imagesSrcToReplace : [],
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
    values : {
      cssToModify : [],
      imagesSrcToReplace : [],
    },
  },
];

function modifyCssOfSelectors(selectorsArray, styleRules) {
  if (DEBUG_ACTIVATED) {
    console.log('> PROCESSING MODIFY CSS OF SELECTORS');
  }

  const selectors = selectorsArray.join(', ');
  const displayNoneRule = `${selectors} { ${styleRules.join(' !important; ')} !important; }\n`;

  const style = document.createElement('style');
  style.textContent = style.textContent
    ? style.textContent + `${displayNoneRule}`
    : displayNoneRule;
  document.head.prepend(style);
}

function processBackgroundImagesSrcToHidePermanently(selectorsArray) {
  if (DEBUG_ACTIVATED) {
    console.log('> PROCESSING BACKGROUND IMAGES SRC TO HIDE PERMANENTLY');
  }

  const selectors = selectorsArray.join(', ');
  const displayNoneRule = `${selectors} { background-image: none !important; }\n`;

  const style = document.createElement('style');
  style.textContent = style.textContent
    ? style.textContent + `${displayNoneRule}`
    : displayNoneRule;
  document.head.prepend(style);
}

function processImagesSrcToHidePermanently(selectorsArray) {
  if (DEBUG_ACTIVATED) {
    console.log('> PROCESSING IMAGES SRC TO HIDE PERMANENTLY');
  }

  const selectors = selectorsArray.join(', ');
  const displayNoneRule = `${selectors} { display: none !important; }\n`;

  const style = document.createElement('style');
  style.textContent = style.textContent
    ? style.textContent + `${displayNoneRule}`
    : displayNoneRule;
  document.head.prepend(style);
}

function processImagesSrcToReplace(selectorsArray, newSrc) {
  if (DEBUG_ACTIVATED) {
    console.log('> PROCESSING IMAGES SRC TO REPLACE');
  }
  const elements =
    selectorsArray.length > 0 ? document.querySelectorAll(selectorsArray.join(', ')) : [];
  let nbOfElementsProcessed = 0;
  if (DEBUG_ACTIVATED && elements.length > 0) {
    console.log('> nb of elements:', elements.length);
  }
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

function processImagesToHideTemporarily(selectorsArray) {
  if (DEBUG_ACTIVATED) {
    console.log('> PROCESSING IMAGES TO HIDE TEMPORARILY');
  }
  //TODO improve with style
  const elements =
    selectorsArray.length > 0 ? document.querySelectorAll(selectorsArray.join(', ')) : [];
  let nbOfElementsProcessed = 0;
  if (DEBUG_ACTIVATED && elements.length > 0) {
    console.log('> nb of elements:', elements.length);
  }
  elements.forEach((element) => {
    if (element) {
      element.style.display = 'none';
      nbOfElementsProcessed++;
    }
  });
  if (DEBUG_ACTIVATED) {
    console.log('> nb of elements processed:', nbOfElementsProcessed);
  }
}

function processImagesToShowAgain(selectorsArray) {
  if (DEBUG_ACTIVATED) {
    console.log('> PROCESSING IMAGES TO SHOW AGAIN');
  }
  //TODO improve with style
  const elements =
    selectorsArray.length > 0 ? document.querySelectorAll(selectorsArray.join(', ')) : [];
  let nbOfElementsProcessed = 0;
  if (DEBUG_ACTIVATED && elements.length > 0) {
    console.log('> nb of elements:', elements.length);
  }
  elements.forEach((element) => {
    if (element && element.style) {
      element.style.display = 'block';
      nbOfElementsProcessed++;
    }
  });
  if (DEBUG_ACTIVATED) {
    console.log('> nb of elements processed:', nbOfElementsProcessed);
  }
}

function runProcessesOnDOMContentLoaded() {
  if (DEBUG_LIMIT_ACTIVATED) {
    debugHideTemporarilyLimitCount++;
    if (debugHideTemporarilyLimitCount > 3) {
      DEBUG_ACTIVATED = false;
    }
  }

  PAGE_LIST.forEach(({name, selectors : {imagesToHideTemporarily}, slug}) => {
    if (DEBUG_ACTIVATED) {
      console.log(' ');
      console.log(`> ${name} PAGE${name === 'ALL' ? 'S' : ''}`);
    }

    if (!slug || window.location.href.includes(slug)) {
      processImagesToHideTemporarily(imagesToHideTemporarily);
    }
  })
}

function runProcessesOnPageLoad() {
  if (DEBUG_LIMIT_ACTIVATED) {
    debugHideLimitCount++;
    if (debugHideLimitCount > 3) {
      DEBUG_ACTIVATED = false;
    }
  }

  PAGE_LIST.forEach(({
                       name,
                       selectors : {
                         backgroundImagesSrcToHidePermanently,
                         cssToModify,
                         imagesSrcToHidePermanently,
                         imagesSrcToReplace
                       },
                       slug,
                       values
                     }) => {
    if (DEBUG_ACTIVATED) {
      console.log(' ');
      console.log(`> ${name} PAGE${name === 'ALL' ? 'S' : ''}`);
    }

    if (!slug || window.location.href.includes(slug)) {
      processBackgroundImagesSrcToHidePermanently(backgroundImagesSrcToHidePermanently);
      processImagesSrcToHidePermanently(imagesSrcToHidePermanently);
      processImagesSrcToReplace(imagesSrcToReplace, values.imagesSrcToReplace);

      for (let i = 0; i < cssToModify.length; i++) {
        modifyCssOfSelectors(cssToModify[i], values.cssToModify[i]);
      }
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
      console.log('');
      console.log('> SPECIAL BUTTON CLICKED (IMG PROCESSING STOPPED)');
    }
    if (window.location.href.includes('/quest/')) {
      processImagesToShowAgain(['.canvas > .picture']);
    }
  }
});

// DOM is ready, resources may still be loading
document.addEventListener('DOMContentLoaded', function () {
  if (DEBUG_ACTIVATED) {
    console.log('> ');
    console.log('> DOMContentLoaded');
  }
  runProcessesOnDOMContentLoaded();
});

runProcessesOnPageLoad();
