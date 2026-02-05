// ==UserScript==
// @name         Hentai Heroes SFW
// @namespace    https://sleazyfork.org/fr/scripts/539097-hentai-heroes-sfw
// @description  Removing explicit images in Hentai Heroes game and setting all girls / champions poses to the default one.
// @version      2.0.5
// @match        https://*.comixharem.com/*
// @match        https://*.hentaiheroes.com/*
// @match        https://*.pornstarharem.com/*
// @run-at       document-start
// @grant        none
// @author       Geto_hh
// @license      MIT
// ==/UserScript==

// ==CHANGELOG==
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

let DEBUG_ACTIVATED = false;
const DEBUG_LIMIT_ACTIVATED = false;

let debugHideLimitCount = 0;
let debugHideTemporarilyLimitCount = 0;
let debugModifyLimitCount = 0;

let foundMatchingUrl = false;

const DEFAULT_BACKGROUND_URL =
  'https://hh2.hh-content.com/pictures/gallery/6/2200x/9c04e3d2df8d992146eea132225d2d54.jpg';
const NEW_BACKGROUNG_URL =
  'https://hh2.hh-content.com/pictures/gallery/6/2200x/401-a8339a2168753900db437d91f2ed39ff.jpg';

const HIDE_BACKGROUND = false;
const HIDE_GIRL_AVATARS = true;
const HIDE_PLAYER_AVATARS = true;
const REPLACE_BACKGROUND = true;

const NB_OF_GIRL_ICONS_TO_PROCESS_AT_ONCE = 20;
let currentIconIndex = 0;

let observer;
let killObserverCount = 0;
const killObserverDelay = 10;
let noElementsProcessedCount = 0;
const noElementsProcessedDelay = 10;
let noIconElementsProcessedCount = 0;
const noIconElementsProcessedDelay = 10;
let observerGirlImagesProcessed = false;
let observerGirlAvatarsImagesProcessed = false;
let observerGirlIconsProcessStarted = false;
let observerGirlIconsProcessEnded = false;

const girlsWithSFWIndexEqualsOne = ['225777755', '298984036'];

const girlsRegex =
  /(.*\/)([0-9]+)\/([a-zA-Z]+)([0-9t]+)([a-zA-Z0-9-_]*)\.(png|jpg|jpeg|webp|gif|bmp|tiff|svg|ico)$/;

// Activities screen https://www.hentaiheroes.com/activities.html
const activitiesSelectorsOfBackgroundImagesSrcToRemove = ['.contest > .contest_header'];
const activitiesSelectorsOfImagesSrcToRemove = [
  ...(HIDE_PLAYER_AVATARS ? ['.player-profile-picture > img'] : []),
  ...(HIDE_BACKGROUND ? ['.fixed_scaled > img'] : []),
  '.mission_image > img',
  '.pop_thumb > img',
  '.pop-details-left > img',
  '.pop_girl_avatar > img',
  '.pop-record > .pop-record-bg',
  '.timer-girl-container > img',
];
const activitiesSelectorsOfGirlsSrcToModify = [];
const activitiesSelectorsOfGirlsAvatarsSrcToModify = [];
const activitiesSelectorsOfGirlsNumerousIconsSrcToModify = [];

// Adventures screen https://www.hentaiheroes.com/adventures.html
const adventuresSelectorsOfBackgroundImagesSrcToRemove = ['.adventure-card-container'];
const adventuresSelectorsOfImagesSrcToRemove = [
  ...(HIDE_PLAYER_AVATARS ? ['.player-profile-picture > img'] : []),
  ...(HIDE_BACKGROUND ? ['.fixed_scaled > img'] : []),
];
const adventuresSelectorsOfGirlsSrcToModify = [];
const adventuresSelectorsOfGirlsAvatarsSrcToModify = [];
const adventuresSelectorsOfGirlsNumerousIconsSrcToModify = [];

// Champions screen https://www.hentaiheroes.com/champions/3
const championsSelectorsOfImagesSrcToRemove = [
  ...(HIDE_PLAYER_AVATARS ? ['.player-profile-picture > img'] : []),
  ...(HIDE_BACKGROUND ? ['.fixed_scaled > img'] : []),
  '.champions-animation > .avatar',
  '.champions-animation > .champions-over__champion-image',
  '.defender-preview > img',
  '.attacker-preview > .character',
  '.rounds-info__figures > .figure',
];
const championSelectorsOfGirlsSrcToModify = [
  '.girl-box__draggable > .girl-box__ico',
  '.girl > .avatar',
  '.girl-card > img',
];
const championSelectorsOfGirlsAvatarsSrcToModify = [];
const championSelectorsOfGirlsNumerousIconsSrcToModify = [];

// Characters screen https://www.hentaiheroes.com/characters/461620826
const charactersSelectorsOfGirlsSrcToModify = [
  '.team-slot-container > img',
  '.variation_girl > .girl_ava',
];
const charactersSelectorsOfGirlsAvatarsSrcToModify = [
  '.avatar-box > .avatar',
  '.awakening-container > .avatar',
];
const charactersSelectorsOfGirlsNumerousIconsSrcToModify = ['.left > img'];
const charactersSelectorsOfImagesSrcToRemove = ['.lively_scene > img'];

// Club champion screen https://www.hentaiheroes.com/club-champion.html
const clubChampionSelectorsOfImagesSrcToRemove = [
  ...(HIDE_PLAYER_AVATARS ? ['.player-profile-picture > img'] : []),
  ...(HIDE_BACKGROUND ? ['.fixed_scaled > img'] : []),
  '.figure',
  '.girl-fav-position > .favorite-position',
  '.girl-card > .fav-position',
];
const clubChampionSelectorsOfGirlsSrcToModify = [
  '.girl-box__draggable > .girl-box__ico',
  '.girl > .avatar',
  '.girl-card > img',
];
const clubChampionSelectorsOfGirlsAvatarsSrcToModify = [
  '.champions-over__champion-wrapper > .avatar',
];
const clubChampionSelectorsOfGirlsNumerousIconsSrcToModify = [];

// Edit Labyrinth team screen https://www.hentaiheroes.com/edit-labyrinth-team.html
const editLabyrinthTeamSelectorsOfGirlsSrcToModify = ['.base-hexagon > .girl_img'];
const editLabyrinthTeamSelectorsOfGirlsAvatarsSrcToModify = ['.girl-display > .avatar'];
const editLabyrinthTeamSelectorsOfGirlsNumerousIconsSrcToModify = [
  '.harem-girl-container > .girl_img', // all girls => 282 for me
];

// Edit team screen https://www.hentaiheroes.com/edit-team.html
const editTeamSelectorsOfGirlsSrcToModify = ['.base-hexagon > .girl_img'];
const editTeamSelectorsOfGirlsAvatarsSrcToModify = ['.girl-display > .avatar'];
const editTeamSelectorsOfGirlsNumerousIconsSrcToModify = ['.harem-girl-container > .girl_img'];

// Edit world boss team screen https://www.hentaiheroes.com/edit-world-boss-team.html
const editWorldBossTeamSelectorsOfGirlsSrcToModify = ['.base-hexagon > .girl_img'];
const editWorldBossTeamSelectorsOfGirlsAvatarsSrcToModify = ['.girl-display > .avatar'];
const editWorldBossTeamSelectorsOfGirlsNumerousIconsSrcToModify = [
  '.harem-girl-container > .girl_img',
];

// Event pop-up https://www.hentaiheroes.com/event.html?tab=sm_event_36
const eventSelectorsOfImagesSrcToRemove = [
  ...(HIDE_PLAYER_AVATARS ? ['.player-profile-picture > img'] : []),
  ...(HIDE_BACKGROUND ? ['.fixed_scaled > img'] : []),
  '.sm-static-girl > img',
  '.lse_puzzle_wrapper > .lively_scene_image',
  '.lively_scenes_preview > div > img',
];
const eventSelectorsOfGirlsSrcToModify = [];
const eventSelectorsOfGirlsAvatarsSrcToModify = ['.girls-container > .avatar', '.slide > .avatar'];
const eventSelectorsOfGirlsNumerousIconsSrcToModify = [];

// Girl screen https://www.hentaiheroes.com/girl/143960742
const girlSelectorsOfGirlsSrcToModify = [
  '#next_girl > img',
  '#previous_girl > img',
  '.base-hexagon > .girl_img',
  '.girl-skills-avatar > .avatar',
  '.girl-avatar-wrapper > .avatar',
];
const girlSelectorsOfGirlsAvatarsSrcToModify = ['.team-slot-container > img'];
const girlSelectorsOfGirlsNumerousIconsSrcToModify = [];

// God path screen https://www.hentaiheroes.com/god-path.html
const godPathSelectorsOfGirlsSrcToModify = [];
const godPathSelectorsOfGirlsAvatarsSrcToModify = ['.feature-girl > .avatar'];
const godPathSelectorsOfGirlsNumerousIconsSrcToModify = [];
const godPathSelectorsOfImagesSrcToRemove = ['.container-category > .feature-bgr'];

// Home screen https://www.hentaiheroes.com/home.html
const homeSelectorsOfBackgroundImagesSrcToRemove = [
  '#crosspromo_show_ad > .crosspromo_banner',
  '#special-offer',
  '.news_page_content > .news_page_pic',
  '.news_thumb > .news_thumb_pic',
];
const homeSelectorsOfImagesSrcToRemove = [
  ...(HIDE_PLAYER_AVATARS ? ['.player-profile-picture > img'] : []),
  ...(HIDE_BACKGROUND ? ['.fixed_scaled > img'] : []),
  '.waifu-container > .avatar',
  '.info-top-block > .bunny-rotate-device',
  '.pwa-info-container > .install_app_girl',
];
const homeSelectorsOfImagesSrcToReplace = ['.fixed_scaled > img'];
const homeSelectorsOfGirlsSrcToModify = [];
const homeSelectorsOfGirlsAvatarsSrcToModify = [];
const homeSelectorsOfGirlsNumerousIconsSrcToModify = [];

// Labyrinth screen https://www.hentaiheroes.com/labyrinth.html
const labyrinthSelectorsOfGirlsSrcToModify = ['.relic-infos > .girl-image'];
const labyrinthSelectorsOfGirlsAvatarsSrcToModify = [
  '.shop-labyrinth-girl > .avatar',
  '.labyrinth-girl > .avatar',
];
const labyrinthSelectorsOfGirlsNumerousIconsSrcToModify = [];

// Labyrinth battle screen https://www.hentaiheroes.com/labyrinth-battle.html
const labyrinthBattleSelectorsOfGirlsSrcToModify = ['.base-hexagon > .girl_img'];
const labyrinthBattleSelectorsOfGirlsAvatarsSrcToModify = [
  '.pvp-girls > .avatar',
  '.labyrinth-girl > .avatar',
];
const labyrinthBattleSelectorsOfGirlsNumerousIconsSrcToModify = [];

// Labyrinth entrance screen https://www.hentaiheroes.com/labyrinth-entrance.html
const labyrinthEntranceSelectorsOfImagesSrcToRemove = [];
const labyrinthEntranceSelectorsOfGirlsSrcToModify = [];
const labyrinthEntranceSelectorsOfGirlsAvatarsSrcToModify = ['.labyrinth-girl > .avatar'];
const labyrinthEntranceSelectorsOfGirlsNumerousIconsSrcToModify = [];

// Labyrinth pool select screen https://www.hentaiheroes.com/labyrinth-pool-select.html
const labyrinthPoolSelectSelectorsOfGirlsSrcToModify = [];
const labyrinthPoolSelectSelectorsOfGirlsAvatarsSrcToModify = [];
const labyrinthPoolSelectSelectorsOfGirlsNumerousIconsSrcToModify = [
  '.girl-container > .girl-image',
];
const labyrinthPoolSelectSelectorsOfImagesSrcToRemove = [
  ...(HIDE_PLAYER_AVATARS ? ['.player-profile-picture > img'] : []),
  ...(HIDE_BACKGROUND ? ['.fixed_scaled > img'] : []),
];

// Labyrinth pre-battle screen https://www.hentaiheroes.com/labyrinth-pre-battle.html
const labyrinthPreBattleSelectorsOfGirlsSrcToModify = ['.base-hexagon > .girl_img'];
const labyrinthPreBattleSelectorsOfGirlsAvatarsSrcToModify = ['.labyrinth-girl > .avatar'];
const labyrinthPreBattleSelectorsOfGirlsNumerousIconsSrcToModify = [];

// Leagues screen https://www.hentaiheroes.com/leagues.html
const leaguesSelectorsOfGirlsSrcToModify = ['.base-hexagon > .girl_img'];
const leaguesSelectorsOfGirlsAvatarsSrcToModify = ['.girl-block > .avatar'];
const leaguesSelectorsOfGirlsNumerousIconsSrcToModify = [];
const leaguesSelectorsOfImagesSrcToRemove = [
  ...(HIDE_PLAYER_AVATARS ? ['.square-avatar-wrapper > img', '.player-profile-picture > img'] : []),
  ...(HIDE_BACKGROUND ? ['.fixed_scaled > img'] : []),
  '.tier_icons > img',
];

// League pre-battle screen https://www.hentaiheroes.com/leagues-pre-battle.html
const leaguePreBattleSelectorsOfGirlsSrcToModify = ['.base-hexagon > .girl_img'];
const leaguePreBattleSelectorsOfGirlsAvatarsSrcToModify = ['.girl-block > .avatar'];
const leaguePreBattleSelectorsOfGirlsNumerousIconsSrcToModify = [];
const leaguePreBattleSelectorsOfImagesSrcToRemove = [
  ...(HIDE_PLAYER_AVATARS ? ['.player-profile-picture > img'] : []),
  ...(HIDE_BACKGROUND ? ['.fixed_scaled > img'] : []),
];

// League battle screen https://www.hentaiheroes.com/league-battle.html
const leagueBattleSelectorsOfGirlsSrcToModify = ['.base-hexagon > .girl_img'];
const leagueBattleSelectorsOfGirlsAvatarsSrcToModify = ['.new-battle-girl-container > .avatar'];
const leagueBattleSelectorsOfGirlsNumerousIconsSrcToModify = [];
const leagueBattleSelectorsOfImagesSrcToRemove = [
  ...(HIDE_PLAYER_AVATARS ? ['.player-profile-picture > img'] : []),
  ...(HIDE_BACKGROUND ? ['.fixed_scaled > img'] : []),
];

// Login pop-up (no precise url as it can appear on any page)
const loginSelectorsOfImagesSrcToRemove = [
  '.intro > .quest-container > #scene > .canvas > .picture',
  '.background_image-style > img',
];

// Love raids screen https://www.hentaiheroes.com/love-raids.html
const loveRaidsSelectorsOfGirlsSrcToModify = [];
const loveRaidsSelectorsOfGirlsAvatarsSrcToModify = [
  '.left-girl-container > .avatar',
  '.left-girl-container > .girl-img',
  '.right-girl-container > .avatar',
  '.right-girl-container > .girl-img',
];
const loveRaidsSelectorsOfGirlsNumerousIconsSrcToModify = [];
const loveRaidsSelectorsOfImagesSrcToRemove = [
  ...(HIDE_PLAYER_AVATARS ? ['.player-profile-picture > img'] : []),
  ...(HIDE_BACKGROUND ? ['.fixed_scaled > img'] : []),
];

// Member progression screen https://www.hentaiheroes.com/member-progression.html
const memberProgressionSelectorsOfImagesSrcToRemove = ['.page-girl > img'];
const memberProgressionSelectorsOfGirlsSrcToModify = [];
const memberProgressionSelectorsOfGirlsAvatarsSrcToModify = [];
const memberProgressionSelectorsOfGirlsNumerousIconsSrcToModify = [];

// No enegery pop-up (no precise url as it can be opened with the plus icon on any page)
const noEnergySelectorsOfImagesSrcToRemove = ['#no_energy_popup > .avatar'];

// Pachinko screen https://www.hentaiheroes.com/pachinko.html
const pachinkoSelectorsOfImagesSrcToRemove = [
  ...(HIDE_PLAYER_AVATARS ? ['.player-profile-picture > img'] : []),
  ...(HIDE_BACKGROUND ? ['.fixed_scaled > img'] : []),
  '.pachinko_img > img',
];
const pachinkoSelectorsOfGirlsSrcToModify = [];
const pachinkoSelectorsOfGirlsAvatarsSrcToModify = [];
const pachinkoSelectorsOfGirlsNumerousIconsSrcToModify = [];

// Pantheon screen https://www.hentaiheroes.com/pantheon.html
const pantheonSelectorsOfGirlsSrcToModify = [];
const pantheonSelectorsOfGirlsAvatarsSrcToModify = ['.girl-container > .avatar'];
const pantheonSelectorsOfGirlsNumerousIconsSrcToModify = [];
const pantheonSelectorsOfImagesSrcToRemove = [
  ...(HIDE_PLAYER_AVATARS ? ['.player-profile-picture > img'] : []),
  ...(HIDE_BACKGROUND ? ['.fixed_scaled > img'] : []),
  '.girl-container > .avatar',
  '.pantheon_bgr > .stage-bgr',
];

// Pantheon battle screen https://www.hentaiheroes.com/pantheon-battle.html
const pantheonBattleSelectorsOfGirlsSrcToModify = ['.base-hexagon > .girl_img'];
const pantheonBattleSelectorsOfGirlsAvatarsSrcToModify = ['.new-battle-girl-container > .avatar'];
const pantheonBattleSelectorsOfGirlsNumerousIconsSrcToModify = [];
const pantheonBattleSelectorsOfImagesSrcToRemove = [
  ...(HIDE_PLAYER_AVATARS ? ['.player-profile-picture > img'] : []),
  ...(HIDE_BACKGROUND ? ['.fixed_scaled > img'] : []),
];

// Pantheon pre-battle screen https://www.hentaiheroes.com/pantheon-pre-battle.html
const pantheonPreBattleSelectorsOfGirlsSrcToModify = ['.base-hexagon > .girl_img'];
const pantheonPreBattleSelectorsOfGirlsAvatarsSrcToModify = [];
const pantheonPreBattleSelectorsOfGirlsNumerousIconsSrcToModify = [];
const pantheonPreBattleSelectorsOfImagesSrcToRemove = [
  '.fixed_scaled > img',
  '.player-profile-picture > img',
];

// Path of glory screen https://www.hentaiheroes.com/path-of-glory.html
const pathOfGlorySelectorsOfGirlsSrcToModify = [];
const pathOfGlorySelectorsOfGirlsAvatarsSrcToModify = [
  '.left_side > .avatar',
  '.right_side > .avatar',
];
const pathOfGlorySelectorsOfGirlsNumerousIconsSrcToModify = [];
const pathOfGlorySelectorsOfImagesSrcToRemove = [];

// Path of valor screen https://www.hentaiheroes.com/path-of-valor.html
const pathOfValorSelectorsOfGirlsSrcToModify = [];
const pathOfValorSelectorsOfGirlsAvatarsSrcToModify = [
  '.left_side > .avatar',
  '.right_side > .avatar',
];
const pathOfValorSelectorsOfGirlsNumerousIconsSrcToModify = [];
const pathOfValorSelectorsOfImagesSrcToRemove = [];

// Penta drill screen https://www.hentaiheroes.com/penta-drill.html
const pentaDrillSelectorsOfGirlsSrcToModify = ['.slot_girl_shards > img'];
const pentaDrillSelectorsOfGirlsAvatarsSrcToModify = ['.girl_block > .avatar'];
const pentaDrillSelectorsOfGirlsNumerousIconsSrcToModify = [];
const pentaDrillSelectorsOfImagesSrcToRemove = [];

// Penta drill arena screen https://www.hentaiheroes.com/penta-drill-arena.html
const pentaDrillArenaSelectorsOfGirlsSrcToModify = ['.slot_girl_shards > img'];
const pentaDrillArenaSelectorsOfGirlsAvatarsSrcToModify = ['.girl_block > .avatar'];
const pentaDrillArenaSelectorsOfGirlsNumerousIconsSrcToModify = [];
const pentaDrillArenaSelectorsOfImagesSrcToRemove = [];

// Penta drill arena screen https://www.hentaiheroes.com/penta-drill-battle.html
const pentaDrillBattleSelectorsOfGirlsSrcToModify = ['.base-hexagon > .girl_img'];
const pentaDrillBattleSelectorsOfGirlsAvatarsSrcToModify = ['.pvp-girls > .avatar'];
const pentaDrillBattleSelectorsOfGirlsNumerousIconsSrcToModify = [];
const pentaDrillBattleSelectorsOfImagesSrcToRemove = [];

// Path of valor screen https://www.hentaiheroes.com/pvp-arena.html
const pvpArenaSelectorsOfGirlsSrcToModify = [];
const pvpArenaSelectorsOfGirlsAvatarsSrcToModify = ['.feature-girl > .avatar'];
const pvpArenaSelectorsOfGirlsNumerousIconsSrcToModify = [];
const pvpArenaSelectorsOfImagesSrcToRemove = [];

// Quest / Affection scene screen https://www.hentaiheroes.com/quest/1003697?grade=1
const questSelectorsOfImagesToHide = ['.canvas > .picture'];

// Seasonal screen https://www.hentaiheroes.com/season.html
const seasonSelectorsOfGirlsSrcToModify = ['.slot_girl_shards > img'];
const seasonSelectorsOfGirlsAvatarsSrcToModify = ['.girl_block > .avatar'];
const seasonSelectorsOfGirlsNumerousIconsSrcToModify = [];
const seasonSelectorsOfImagesSrcToRemove = [];

// Season arena screen https://www.hentaiheroes.com/season-arena.html
const seasonArenaSelectorsOfGirlsSrcToModify = ['.base-hexagon > .girl_img'];
const seasonArenaSelectorsOfGirlsAvatarsSrcToModify = [];
const seasonArenaSelectorsOfGirlsNumerousIconsSrcToModify = [];
const seasonArenaSelectorsOfImagesSrcToRemove = [
  ...(HIDE_PLAYER_AVATARS ? ['.player-profile-picture > img'] : []),
  ...(HIDE_BACKGROUND ? ['.fixed_scaled > img'] : []),
];

// Season battle screen https://www.hentaiheroes.com/season-battle.html
const seasonBattleSelectorsOfGirlsSrcToModify = ['.base-hexagon > .girl_img'];
const seasonBattleSelectorsOfGirlsAvatarsSrcToModify = ['.new-battle-girl-container > .avatar'];
const seasonBattleSelectorsOfGirlsNumerousIconsSrcToModify = [];
const seasonBattleSelectorsOfImagesSrcToRemove = [
  ...(HIDE_PLAYER_AVATARS ? ['.player-profile-picture > img'] : []),
  ...(HIDE_BACKGROUND ? ['.fixed_scaled > img'] : []),
];

// Seasonal screen https://www.hentaiheroes.com/seasonal.html
const seasonalSelectorsOfGirlsSrcToModify = ['.slot_girl_shards > img'];
const seasonalSelectorsOfGirlsAvatarsSrcToModify = ['.girls-reward-container > .avatar'];
const seasonalSelectorsOfGirlsNumerousIconsSrcToModify = [];
const seasonalSelectorsOfImagesSrcToRemove = ['.lively_scene > img'];

// Shop pop-up (no precise url as it can be opened with the chest icon on the homepage or the plus icon on any page)
const shopSelectorsOfImagesSrcToRemove = [
  '.container > .avatar',
  '.prestige > .avatar',
  '#special-offer > .background-video',
];
const shopSelectorsOfBackgroundImagesSrcToRemove = [
  '.bundle > #special-offer',
  '.bundle > #starter-offer',
  '.mc-card-container > .rewards-container',
  '.product-offer-container > .product-offer-background-container',
];

// Side quests screen https://www.hentaiheroes.com/side-quests.html
const sideQuestsSelectorsOfImagesSrcToRemove = ['.side-quest-image > img'];
const sideQuestsSelectorsOfGirlsSrcToModify = [];
const sideQuestsSelectorsOfGirlsAvatarsSrcToModify = [];
const sideQuestsSelectorsOfGirlsNumerousIconsSrcToModify = [];

// Teams screen https://www.hentaiheroes.com/teams.html
const teamsSelectorsOfGirlsSrcToModify = [
  '.team-slot-container > img',
  '.base-hexagon > .girl_img',
];
const teamsSelectorsOfGirlsAvatarsSrcToModify = [];
const teamsSelectorsOfGirlsNumerousIconsSrcToModify = [];
const teamsSelectorsOfImagesSrcToRemove = ['.girl-image-container > img'];

// Troll battle screen https://www.hentaiheroes.com/troll-battle.html
const trollBattleSelectorsOfGirlsSrcToModify = ['.base-hexagon > .girl_img'];
const trollBattleSelectorsOfGirlsAvatarsSrcToModify = ['.new-battle-girl-container > .avatar'];
const trollBattleSelectorsOfGirlsNumerousIconsSrcToModify = [];
const trollBattleSelectorsOfImagesSrcToRemove = [
  ...(HIDE_PLAYER_AVATARS ? ['.player-profile-picture > img'] : []),
  ...(HIDE_BACKGROUND ? ['.fixed_scaled > img'] : []),
];

// Troll pre-battle screen https://www.hentaiheroes.com/troll-pre-battle.html
const trollPreBattleSelectorsOfGirlsSrcToModify = ['.base-hexagon > .girl_img'];
const trollPreBattleSelectorsOfGirlsAvatarsSrcToModify = [];
const trollPreBattleSelectorsOfGirlsNumerousIconsSrcToModify = [];
const trollPreBattleSelectorsOfImagesSrcToRemove = [
  ...(HIDE_PLAYER_AVATARS ? ['.player-profile-picture > img'] : []),
  ...(HIDE_BACKGROUND ? ['.fixed_scaled > img'] : []),
];

// Main quest troll screens https://www.hentaiheroes.com/world/12
const worldSelectorsOfImagesSrcToRemove = ['.troll_world > .troll-tier-img'];
const worldSelectorsOfGirlsSrcToModify = [];
const worldSelectorsOfGirlsAvatarsSrcToModify = ['.girl_world > .avatar'];
const worldSelectorsOfGirlsNumerousIconsSrcToModify = [];

// World boss battle screen https://www.hentaiheroes.com/world-boss-battle.html
const worldBossBattleSelectorsOfGirlsSrcToModify = ['.base-hexagon > .girl_img'];
const worldBossBattleSelectorsOfGirlsAvatarsSrcToModify = ['.pvp-girls > .avatar'];
const worldBossBattleSelectorsOfGirlsNumerousIconsSrcToModify = [];

// World boss event screen https://www.hentaiheroes.com/world-boss-event
const worldBossEventSelectorsOfImagesSrcToRemove = [
  '.left-container > .avatar',
  '.right-container > .avatar',
];
const worldBossEventSelectorsOfGirlsSrcToModify = [];
const worldBossEventSelectorsOfGirlsAvatarsSrcToModify = [];
const worldBossEventSelectorsOfGirlsNumerousIconsSrcToModify = [];

// World boss pre-battle screen https://www.hentaiheroes.com/world-boss-pre-battle
const worldBossEventPreBattleSelectorsOfGirlsSrcToModify = ['.base-hexagon > .girl_img'];
const worldBossEventPreBattleSelectorsOfGirlsAvatarsSrcToModify = [];
const worldBossEventPreBattleSelectorsOfGirlsNumerousIconsSrcToModify = [];

function initObserver() {
  if (DEBUG_ACTIVATED) {
    console.log('> ');
    console.log('> INIT OBSERVER');
  }

  resetObserverState();
  killObserverCount = 0;
  noElementsProcessedCount = 0;
  noIconElementsProcessedCount = 0;

  if (!observer) {
    if (DEBUG_ACTIVATED) {
      console.log('> ');
      console.log('> MutationObserver initialized.');
    }
    // Use MutationObserver to watch for dynamically loaded images
    observer = new MutationObserver(function (mutations) {
      mutations.forEach(function () {
        modifyMedias();
      });
    });
  }

  // Start observing the main document
  if (observer) {
    if (DEBUG_ACTIVATED) {
      console.log('> ');
      console.log('> MutationObserver started.');
    }
    observer.observe(document.body, { childList: true, subtree: true });
  }
}

function resetObserverState() {
  observerGirlImagesProcessed = false;
  observerGirlAvatarsImagesProcessed = false;
  observerGirlIconsProcessStarted = false;
  observerGirlIconsProcessEnded = false;
}

function killObserver() {
  if (DEBUG_ACTIVATED) {
    console.log('> ');
    console.log('> killObserver');
    console.log('> killObserverCount =', killObserverCount);
  }
  if (observer) {
    if (DEBUG_ACTIVATED) {
      console.log('> MutationObserver disconnected.');
    }
    observer.disconnect();
    observer = null;
  }
  resetObserverState();
  killObserverCount = 0;
  noElementsProcessedCount = 0;
  noIconElementsProcessedCount = 0;
}

function processGirlImagesSrcToModify(
  selectorsOfGirlsSrcToModify,
  selectorsOfGirlsAvatarsSrcToModify,
  selectorsOfGirlsNumerousIconsSrcToModify,
) {
  if (DEBUG_ACTIVATED) {
    console.log('> PROCESSING GIRLS SRC TO MODIFY');
  }
  if (observer) {
    if (selectorsOfGirlsSrcToModify.length === 0) {
      observerGirlImagesProcessed = true;
    }
    if (HIDE_GIRL_AVATARS || selectorsOfGirlsAvatarsSrcToModify.length === 0) {
      observerGirlAvatarsImagesProcessed = true;
    }
    if (selectorsOfGirlsNumerousIconsSrcToModify.length === 0) {
      observerGirlIconsProcessStarted = true;
      observerGirlIconsProcessEnded = true;
    }
  }

  if (HIDE_GIRL_AVATARS && selectorsOfGirlsAvatarsSrcToModify.length > 0) {
    processImagesSrcToHidePermanently(selectorsOfGirlsAvatarsSrcToModify);
  }

  const baseSelectors = HIDE_GIRL_AVATARS
    ? [...selectorsOfGirlsSrcToModify]
    : [...selectorsOfGirlsAvatarsSrcToModify, ...selectorsOfGirlsSrcToModify];

  const baseElements =
    baseSelectors.length > 0 ? document.querySelectorAll(baseSelectors.join(', ')) : [];

  const iconElements =
    selectorsOfGirlsNumerousIconsSrcToModify.length > 0
      ? document.querySelectorAll(selectorsOfGirlsNumerousIconsSrcToModify.join(', '))
      : [];

  const totalIconElements = iconElements.length;
  const processIconElements = totalIconElements > 0;
  const elements = baseElements.length > 0 ? Array.from(baseElements) : [];

  const startIndex = currentIconIndex;
  const endIndex = Math.min(startIndex + NB_OF_GIRL_ICONS_TO_PROCESS_AT_ONCE, totalIconElements);
  const batchedIconElements = Array.from(iconElements).slice(startIndex, endIndex);

  currentIconIndex = endIndex >= totalIconElements ? 0 : endIndex;

  if (DEBUG_ACTIVATED) {
    console.log('> nb of baseElements:', elements.length);
    console.log('> nb of iconElements:', totalIconElements);
    console.log('> nb of batchedIconElements:', batchedIconElements.length);
    console.log('> current batch (start, end):', startIndex, endIndex);
  }

  let nbOfElementsProcessed = 0;
  elements.forEach((element) => {
    if (element && element.src && !element.src.includes('grade_skins')) {
      const baseSrc = element.src.split('?')[0];
      const newSrc = baseSrc.replace(girlsRegex, function (match, p1, p2, p3, p4, p5, p6) {
        const sfwIndex = girlsWithSFWIndexEqualsOne.includes(p2) ? '1' : '0';
        return p4 === sfwIndex ? match : p1 + p2 + '/' + p3 + sfwIndex + p5 + '.' + p6;
      });

      if (newSrc !== baseSrc) {
        if (DEBUG_ACTIVATED) {
          console.log('> altering girl src from:', element.outerHTML);
        }
        element.src = newSrc;
        nbOfElementsProcessed++;
      }
    }
  });
  if (DEBUG_ACTIVATED) {
    console.log('> nb of girl elements processed:', nbOfElementsProcessed);
  }
  if (nbOfElementsProcessed === 0) {
    noElementsProcessedCount++;
  }
  if (
    observer &&
    elements.length > 0 &&
    (nbOfElementsProcessed > 0 || noElementsProcessedCount > noElementsProcessedDelay)
  ) {
    if (DEBUG_ACTIVATED) {
      console.log('> OBSERVER GIRL TRUE');
    }
    observerGirlImagesProcessed = true;
    observerGirlAvatarsImagesProcessed = true;
  }

  if (processIconElements) {
    setTimeout(() => {
      let nbOfIconElementsProcessed = 0;
      batchedIconElements.forEach((element) => {
        if (element && element.src && !element.src.includes('grade_skins')) {
          const baseSrc = element.src.split('?')[0];
          const newSrc = baseSrc.replace(girlsRegex, function (match, p1, p2, p3, p4, p5, p6) {
            const sfwIndex = girlsWithSFWIndexEqualsOne.includes(p2) ? '1' : '0';
            return p4 === sfwIndex ? match : p1 + p2 + '/' + p3 + sfwIndex + p5 + '.' + p6;
          });

          if (newSrc !== baseSrc) {
            if (DEBUG_ACTIVATED) {
              console.log('> altering girl icon src from:', element.outerHTML);
            }
            element.src = newSrc;
            nbOfIconElementsProcessed++;
          }
        }
      });
      if (DEBUG_ACTIVATED) {
        console.log('> nb of icon elements processed:', nbOfIconElementsProcessed);
      }
      if (nbOfIconElementsProcessed === 0) {
        noIconElementsProcessedCount++;
      }
      if (
        observer &&
        batchedIconElements.length > 0 &&
        startIndex === 0 &&
        (observerGirlIconsProcessStarted ||
          noIconElementsProcessedCount > noIconElementsProcessedDelay)
      ) {
        observerGirlIconsProcessEnded = true;
      }
      if (
        observer &&
        batchedIconElements.length > 0 &&
        startIndex === 0 &&
        (nbOfIconElementsProcessed > 0 ||
          noIconElementsProcessedCount > noIconElementsProcessedDelay)
      ) {
        if (DEBUG_ACTIVATED) {
          console.log('> OBSERVER GIRL ICONS TRUE');
        }
        observerGirlIconsProcessStarted = true;
      }
    }, 0);
  }

  if (
    observerGirlIconsProcessEnded &&
    observerGirlImagesProcessed &&
    observerGirlAvatarsImagesProcessed
  ) {
    if (killObserverCount < killObserverDelay) {
      killObserverCount++;
      resetObserverState();
    } else {
      killObserver();
    }
  }
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

// Function to process image URLs
function hideMedias() {
  if (DEBUG_LIMIT_ACTIVATED) {
    debugHideLimitCount++;
    if (debugHideLimitCount > 3) {
      DEBUG_ACTIVATED = false;
    }
  }

  if (DEBUG_ACTIVATED) {
    console.log(' ');
    console.log('> ALL PAGES');
  }
  processBackgroundImagesSrcToHidePermanently(shopSelectorsOfBackgroundImagesSrcToRemove);
  processImagesSrcToHidePermanently([
    ...(HIDE_PLAYER_AVATARS ? ['.player-profile-picture > img'] : []),
    ...loginSelectorsOfImagesSrcToRemove,
    ...noEnergySelectorsOfImagesSrcToRemove,
    ...shopSelectorsOfImagesSrcToRemove,
  ]);

  if (window.location.href.includes('/activities.html')) {
    if (DEBUG_ACTIVATED) {
      console.log(' ');
      console.log('> ACTIVITIES PAGE');
    }

    processBackgroundImagesSrcToHidePermanently(activitiesSelectorsOfBackgroundImagesSrcToRemove);
    processImagesSrcToHidePermanently(activitiesSelectorsOfImagesSrcToRemove);
  }

  if (window.location.href.includes('/adventures.html')) {
    if (DEBUG_ACTIVATED) {
      console.log(' ');
      console.log('> ADVENTURES PAGE');
    }

    processBackgroundImagesSrcToHidePermanently(adventuresSelectorsOfBackgroundImagesSrcToRemove);
    processImagesSrcToHidePermanently(adventuresSelectorsOfImagesSrcToRemove);
  }

  if (window.location.href.includes('/champions/')) {
    if (DEBUG_ACTIVATED) {
      console.log(' ');
      console.log('> CHAMPIONS PAGE');
    }

    processImagesSrcToHidePermanently(championsSelectorsOfImagesSrcToRemove);
    modifyCssOfSelectors(
      ['.girl-information'],
      ['display: flex', 'position: relative', 'left: 200px', 'top: 0px'],
    );
    modifyCssOfSelectors(['.nc-event-reward-info'], ['top: 0px', 'left: 100px']);
    modifyCssOfSelectors(
      ['.champions-over__champion-rewards-outline'],
      ['display: flex', 'position: absolute', 'left: -250px', 'top: 50px', 'width: 100%'],
    );
    modifyCssOfSelectors(
      ['.champions-over__champion-wrapper > .champions-over__champion-info'],
      ['display: flex', 'position: relative', 'left: -250px', 'top: 100px'],
    );
    modifyCssOfSelectors(
      ['.champions-over__champion-tier-link'],
      ['display: inline-flex', 'width: 2.5rem', 'height: 2.5rem'],
    );
  }

  if (window.location.href.includes('/characters/')) {
    if (DEBUG_ACTIVATED) {
      console.log(' ');
      console.log('> CHARACTERS PAGE');
    }

    processImagesSrcToHidePermanently(charactersSelectorsOfImagesSrcToRemove);
  }

  if (window.location.href.includes('/club-champion.html')) {
    if (DEBUG_ACTIVATED) {
      console.log(' ');
      console.log('> CLUB CHAMPION PAGE');
    }

    processImagesSrcToHidePermanently(clubChampionSelectorsOfImagesSrcToRemove);
  }

  if (window.location.href.includes('/edit-labyrinth-team.html')) {
    if (DEBUG_ACTIVATED) {
      console.log(' ');
      console.log('> EDIT LABYRINTH TEAM PAGE');
    }
  }

  if (window.location.href.includes('/edit-team.html')) {
    if (DEBUG_ACTIVATED) {
      console.log(' ');
      console.log('> EDIT TEAM PAGE');
    }
  }

  if (window.location.href.includes('/edit-world-boss-team.html')) {
    if (DEBUG_ACTIVATED) {
      console.log(' ');
      console.log('> EDIT WORLD BOSS TEAM PAGE');
    }
  }

  if (window.location.href.includes('/event.html')) {
    if (DEBUG_ACTIVATED) {
      console.log(' ');
      console.log('> EVENT PAGE');
    }

    processImagesSrcToHidePermanently(eventSelectorsOfImagesSrcToRemove);
  }

  if (window.location.href.includes('/girl/')) {
    if (DEBUG_ACTIVATED) {
      console.log(' ');
      console.log('> GIRL PAGE');
    }
  }

  if (window.location.href.includes('/god-path.html')) {
    if (DEBUG_ACTIVATED) {
      console.log(' ');
      console.log('> GOD PATH PAGE');
    }

    processImagesSrcToHidePermanently(godPathSelectorsOfImagesSrcToRemove);
  }

  if (window.location.href.includes('/home.html')) {
    if (DEBUG_ACTIVATED) {
      console.log(' ');
      console.log('> HOME PAGE');
    }

    processImagesSrcToReplace(homeSelectorsOfImagesSrcToReplace, NEW_BACKGROUNG_URL);

    processBackgroundImagesSrcToHidePermanently(homeSelectorsOfBackgroundImagesSrcToRemove);
    processImagesSrcToHidePermanently(homeSelectorsOfImagesSrcToRemove);
  }

  if (window.location.href.includes('/labyrinth.html')) {
    if (DEBUG_ACTIVATED) {
      console.log(' ');
      console.log('> LABYRINTH PAGE');
    }
  }

  if (window.location.href.includes('/labyrinth-battle.html')) {
    if (DEBUG_ACTIVATED) {
      console.log(' ');
      console.log('> LABYRINTH BATTLE PAGE');
    }
  }

  if (window.location.href.includes('/labyrinth-entrance.html')) {
    if (DEBUG_ACTIVATED) {
      console.log(' ');
      console.log('> LABYRINTH ENTRANCE PAGE');
    }

    processImagesSrcToHidePermanently(labyrinthEntranceSelectorsOfImagesSrcToRemove);
  }

  if (window.location.href.includes('/labyrinth-pool-select.html')) {
    if (DEBUG_ACTIVATED) {
      console.log(' ');
      console.log('> LABYRINTH POOL SELECT PAGE');
    }

    processImagesSrcToHidePermanently(labyrinthPoolSelectSelectorsOfImagesSrcToRemove);
  }

  if (window.location.href.includes('/labyrinth-pre-battle.html')) {
    if (DEBUG_ACTIVATED) {
      console.log(' ');
      console.log('> LABYRINTH PRE-BATTLE PAGE');
    }
  }

  if (window.location.href.includes('/leagues.html')) {
    if (DEBUG_ACTIVATED) {
      console.log(' ');
      console.log('> LEAGUES PAGE');
    }

    processImagesSrcToHidePermanently(leaguesSelectorsOfImagesSrcToRemove);
  }

  if (window.location.href.includes('/league-battle.html')) {
    if (DEBUG_ACTIVATED) {
      console.log(' ');
      console.log('> LEAGUE BATTLE PAGE');
    }

    processImagesSrcToHidePermanently(leagueBattleSelectorsOfImagesSrcToRemove);
  }

  if (window.location.href.includes('/leagues-pre-battle.html')) {
    if (DEBUG_ACTIVATED) {
      console.log(' ');
      console.log('> LEAGUE PRE-BATTLE PAGE');
    }

    processImagesSrcToHidePermanently(leaguePreBattleSelectorsOfImagesSrcToRemove);
  }

  if (window.location.href.includes('/love-raids.html')) {
    if (DEBUG_ACTIVATED) {
      console.log(' ');
      console.log('> LOVE RAIDS PAGE');
    }

    processImagesSrcToHidePermanently(loveRaidsSelectorsOfImagesSrcToRemove);
  }

  if (window.location.href.includes('/member-progression.html')) {
    if (DEBUG_ACTIVATED) {
      console.log(' ');
      console.log('> MEMBER PROGRESSION PAGE');
    }

    processImagesSrcToHidePermanently(memberProgressionSelectorsOfImagesSrcToRemove);
  }

  if (window.location.href.includes('/pachinko.html')) {
    if (DEBUG_ACTIVATED) {
      console.log(' ');
      console.log('> PACHINKO PAGE');
    }

    processImagesSrcToHidePermanently(pachinkoSelectorsOfImagesSrcToRemove);
  }

  if (window.location.href.includes('/pantheon.html')) {
    if (DEBUG_ACTIVATED) {
      console.log(' ');
      console.log('> PANTHEON PAGE');
    }

    processImagesSrcToHidePermanently(pantheonSelectorsOfImagesSrcToRemove);
  }

  if (window.location.href.includes('/pantheon-battle.html')) {
    if (DEBUG_ACTIVATED) {
      console.log(' ');
      console.log('> PANTHEON BATTLE PAGE');
    }

    processImagesSrcToHidePermanently(pantheonBattleSelectorsOfImagesSrcToRemove);
  }

  if (window.location.href.includes('/pantheon-pre-battle.html')) {
    if (DEBUG_ACTIVATED) {
      console.log(' ');
      console.log('> PANTHEON PRE-BATTLE PAGE');
    }

    processImagesSrcToHidePermanently(pantheonPreBattleSelectorsOfImagesSrcToRemove);
  }

  if (window.location.href.includes('/path-of-glory.html')) {
    if (DEBUG_ACTIVATED) {
      console.log(' ');
      console.log('> PATH OF GLORY PAGE');
    }

    processImagesSrcToHidePermanently(pathOfGlorySelectorsOfImagesSrcToRemove);
  }

  if (window.location.href.includes('/path-of-valor.html')) {
    if (DEBUG_ACTIVATED) {
      console.log(' ');
      console.log('> PATH OF VALOR PAGE');
    }

    processImagesSrcToHidePermanently(pathOfValorSelectorsOfImagesSrcToRemove);
  }

  if (window.location.href.includes('/penta-drill.html')) {
    if (DEBUG_ACTIVATED) {
      console.log(' ');
      console.log('> PENTA DRILL PAGE');
    }

    processImagesSrcToHidePermanently(pentaDrillSelectorsOfImagesSrcToRemove);
  }

  if (window.location.href.includes('/penta-drill-arena.html')) {
    if (DEBUG_ACTIVATED) {
      console.log(' ');
      console.log('> PENTA DRILL ARENA PAGE');
    }

    processImagesSrcToHidePermanently(pentaDrillArenaSelectorsOfImagesSrcToRemove);
  }

  if (window.location.href.includes('/penta-drill-battle.html')) {
    if (DEBUG_ACTIVATED) {
      console.log(' ');
      console.log('> PENTA DRILL BATTLE PAGE');
    }

    processImagesSrcToHidePermanently(pentaDrillBattleSelectorsOfImagesSrcToRemove);
  }

  if (window.location.href.includes('/pvp-arena.html')) {
    if (DEBUG_ACTIVATED) {
      console.log(' ');
      console.log('> PVP ARENA PAGE');
    }

    processImagesSrcToHidePermanently(pvpArenaSelectorsOfImagesSrcToRemove);
  }

  if (window.location.href.includes('/season.html')) {
    if (DEBUG_ACTIVATED) {
      console.log(' ');
      console.log('> SEASON PAGE');
    }

    processImagesSrcToHidePermanently(seasonSelectorsOfImagesSrcToRemove);
  }

  if (window.location.href.includes('/season-arena.html')) {
    if (DEBUG_ACTIVATED) {
      console.log(' ');
      console.log('> SEASON ARENA PAGE');
    }

    processImagesSrcToHidePermanently(seasonArenaSelectorsOfImagesSrcToRemove);
  }

  if (window.location.href.includes('/season-battle.html')) {
    if (DEBUG_ACTIVATED) {
      console.log(' ');
      console.log('> SEASON BATTLE PAGE');
    }

    processImagesSrcToHidePermanently(seasonBattleSelectorsOfImagesSrcToRemove);
  }

  if (window.location.href.includes('/seasonal.html')) {
    if (DEBUG_ACTIVATED) {
      console.log(' ');
      console.log('> SEASONAL PAGE');
    }

    processImagesSrcToHidePermanently(seasonalSelectorsOfImagesSrcToRemove);
  }

  if (window.location.href.includes('/side-quests.html')) {
    if (DEBUG_ACTIVATED) {
      console.log(' ');
      console.log('> SIDE QUESTS PAGE');
    }

    processImagesSrcToHidePermanently(sideQuestsSelectorsOfImagesSrcToRemove);
  }

  if (window.location.href.includes('/teams.html')) {
    if (DEBUG_ACTIVATED) {
      console.log(' ');
      console.log('> TEAMS PAGE');
    }

    processImagesSrcToHidePermanently(teamsSelectorsOfImagesSrcToRemove);
  }

  if (window.location.href.includes('/troll-battle.html')) {
    if (DEBUG_ACTIVATED) {
      console.log(' ');
      console.log('> TROLL BATTLE PAGE');
    }

    processImagesSrcToHidePermanently(trollBattleSelectorsOfImagesSrcToRemove);
  }

  if (window.location.href.includes('/troll-pre-battle.html')) {
    if (DEBUG_ACTIVATED) {
      console.log(' ');
      console.log('> TROLL PRE-BATTLE PAGE');
    }

    processImagesSrcToHidePermanently(trollPreBattleSelectorsOfImagesSrcToRemove);
  }

  if (window.location.href.includes('/world/')) {
    if (DEBUG_ACTIVATED) {
      console.log(' ');
      console.log('> WORLD PAGE');
    }

    processImagesSrcToHidePermanently(worldSelectorsOfImagesSrcToRemove);
  }

  if (window.location.href.includes('/world-boss-battle.html')) {
    if (DEBUG_ACTIVATED) {
      console.log(' ');
      console.log('> WORLD BOSS BATTLE PAGE');
    }
  }

  if (window.location.href.includes('/world-boss-event')) {
    if (DEBUG_ACTIVATED) {
      console.log(' ');
      console.log('> WORLD BOSS EVENT PAGE');
    }

    processImagesSrcToHidePermanently(worldBossEventSelectorsOfImagesSrcToRemove);
  }

  if (window.location.href.includes('/world-boss-pre-battle')) {
    if (DEBUG_ACTIVATED) {
      console.log(' ');
      console.log('> WORLD BOSS PRE-BATTLE PAGE');
    }
  }
}

function hideMediasTemporarily() {
  if (DEBUG_LIMIT_ACTIVATED) {
    debugHideTemporarilyLimitCount++;
    if (debugHideTemporarilyLimitCount > 3) {
      DEBUG_ACTIVATED = false;
    }
  }

  if (DEBUG_ACTIVATED) {
    console.log(' ');
    console.log('> ALL PAGES');
  }
  if (window.location.href.includes('/quest/')) {
    processImagesToHideTemporarily(questSelectorsOfImagesToHide);
  }

  if (window.location.href.includes('/activities.html')) {
    if (DEBUG_ACTIVATED) {
      console.log(' ');
      console.log('> ACTIVITIES PAGE');
    }
  }

  if (window.location.href.includes('/adventures.html')) {
    if (DEBUG_ACTIVATED) {
      console.log(' ');
      console.log('> ADVENTURES PAGE');
    }
  }

  if (window.location.href.includes('/champions/')) {
    if (DEBUG_ACTIVATED) {
      console.log(' ');
      console.log('> CHAMPIONS PAGE');
    }

    // processGirlImagesSrcToModify(
    //   championSelectorsOfGirlsSrcToModify,
    //   championSelectorsOfGirlsAvatarsSrcToModify,
    //   championSelectorsOfGirlsNumerousIconsSrcToModify,
    // );
  }

  if (window.location.href.includes('/characters/')) {
    if (DEBUG_ACTIVATED) {
      console.log(' ');
      console.log('> CHARACTERS PAGE');
    }

    // processGirlImagesSrcToModify(
    //   charactersSelectorsOfGirlsSrcToModify,
    //   charactersSelectorsOfGirlsAvatarsSrcToModify,
    //   charactersSelectorsOfGirlsNumerousIconsSrcToModify,
    // );
  }

  if (window.location.href.includes('/club-champion.html')) {
    if (DEBUG_ACTIVATED) {
      console.log(' ');
      console.log('> CLUB CHAMPION PAGE');
    }
    // processGirlImagesSrcToModify(
    //   clubChampionSelectorsOfGirlsSrcToModify,
    //   clubChampionSelectorsOfGirlsAvatarsSrcToModify,
    //   clubChampionSelectorsOfGirlsNumerousIconsSrcToModify,
    // );
  }

  if (window.location.href.includes('/edit-labyrinth-team.html')) {
    if (DEBUG_ACTIVATED) {
      console.log(' ');
      console.log('> EDIT LABYRINTH TEAM PAGE');
    }

    // processGirlImagesSrcToModify(
    //   editLabyrinthTeamSelectorsOfGirlsSrcToModify,
    //   editLabyrinthTeamSelectorsOfGirlsAvatarsSrcToModify,
    //   editLabyrinthTeamSelectorsOfGirlsNumerousIconsSrcToModify,
    // );
  }

  if (window.location.href.includes('/edit-team.html')) {
    if (DEBUG_ACTIVATED) {
      console.log(' ');
      console.log('> EDIT TEAM PAGE');
    }

    // processGirlImagesSrcToModify(
    //   editTeamSelectorsOfGirlsSrcToModify,
    //   editTeamSelectorsOfGirlsAvatarsSrcToModify,
    //   editTeamSelectorsOfGirlsNumerousIconsSrcToModify,
    // );
  }

  if (window.location.href.includes('/edit-world-boss-team.html')) {
    if (DEBUG_ACTIVATED) {
      console.log(' ');
      console.log('> EDIT WORLD BOSS TEAM PAGE');
    }

    // processGirlImagesSrcToModify(
    //   editWorldBossTeamSelectorsOfGirlsSrcToModify,
    //   editWorldBossTeamSelectorsOfGirlsAvatarsSrcToModify,
    //   editWorldBossTeamSelectorsOfGirlsNumerousIconsSrcToModify,
    // );
  }

  if (window.location.href.includes('/event.html')) {
    if (DEBUG_ACTIVATED) {
      console.log(' ');
      console.log('> EVENT PAGE');
    }
  }

  if (window.location.href.includes('/girl/')) {
    if (DEBUG_ACTIVATED) {
      console.log(' ');
      console.log('> GIRL PAGE');
    }

    // processGirlImagesSrcToModify(
    //   girlSelectorsOfGirlsSrcToModify,
    //   girlSelectorsOfGirlsAvatarsSrcToModify,
    //   girlSelectorsOfGirlsNumerousIconsSrcToModify,
    // );
  }

  if (window.location.href.includes('/god-path.html')) {
    if (DEBUG_ACTIVATED) {
      console.log(' ');
      console.log('> GOD PATH PAGE');
    }

    // processGirlImagesSrcToModify(
    //   godPathSelectorsOfGirlsSrcToModify,
    //   godPathSelectorsOfGirlsAvatarsSrcToModify,
    //   godPathSelectorsOfGirlsNumerousIconsSrcToModify,
    // );
  }

  if (window.location.href.includes('/home.html')) {
    if (DEBUG_ACTIVATED) {
      console.log(' ');
      console.log('> HOME PAGE');
    }
    // processGirlImagesSrcToModify(
    //   homeSelectorsOfGirlsSrcToModify,
    //   homeSelectorsOfGirlsAvatarsSrcToModify,
    //   homeSelectorsOfGirlsNumerousIconsSrcToModify,
    // );
  }

  if (window.location.href.includes('/labyrinth.html')) {
    if (DEBUG_ACTIVATED) {
      console.log(' ');
      console.log('> LABYRINTH PAGE');
    }

    // processGirlImagesSrcToModify(
    //   labyrinthSelectorsOfGirlsSrcToModify,
    //   labyrinthSelectorsOfGirlsAvatarsSrcToModify,
    //   labyrinthSelectorsOfGirlsNumerousIconsSrcToModify,
    // );
  }

  if (window.location.href.includes('/labyrinth-battle.html')) {
    if (DEBUG_ACTIVATED) {
      console.log(' ');
      console.log('> LABYRINTH BATTLE PAGE');
    }

    // processGirlImagesSrcToModify(
    //   labyrinthBattleSelectorsOfGirlsSrcToModify,
    //   labyrinthBattleSelectorsOfGirlsAvatarsSrcToModify,
    //   labyrinthBattleSelectorsOfGirlsNumerousIconsSrcToModify,
    // );
  }

  if (window.location.href.includes('/labyrinth-entrance.html')) {
    if (DEBUG_ACTIVATED) {
      console.log(' ');
      console.log('> LABYRINTH ENTRANCE PAGE');
    }

    // processGirlImagesSrcToModify(
    //   labyrinthEntranceSelectorsOfGirlsSrcToModify,
    //   labyrinthEntranceSelectorsOfGirlsAvatarsSrcToModify,
    //   labyrinthEntranceSelectorsOfGirlsNumerousIconsSrcToModify,
    // );
  }

  if (window.location.href.includes('/labyrinth-pool-select.html')) {
    if (DEBUG_ACTIVATED) {
      console.log(' ');
      console.log('> LABYRINTH POOL SELECT PAGE');
    }

    // processGirlImagesSrcToModify(
    //   labyrinthPoolSelectSelectorsOfGirlsSrcToModify,
    //   labyrinthPoolSelectSelectorsOfGirlsAvatarsSrcToModify,
    //   labyrinthPoolSelectSelectorsOfGirlsNumerousIconsSrcToModify,
    // );
  }

  if (window.location.href.includes('/labyrinth-pre-battle.html')) {
    if (DEBUG_ACTIVATED) {
      console.log(' ');
      console.log('> LABYRINTH PRE-BATTLE PAGE');
    }

    // processGirlImagesSrcToModify(
    //   labyrinthPreBattleSelectorsOfGirlsSrcToModify,
    //   labyrinthPreBattleSelectorsOfGirlsAvatarsSrcToModify,
    //   labyrinthPreBattleSelectorsOfGirlsNumerousIconsSrcToModify,
    // );
  }

  if (window.location.href.includes('/leagues.html')) {
    if (DEBUG_ACTIVATED) {
      console.log(' ');
      console.log('> LEAGUES PAGE');
    }

    // processGirlImagesSrcToModify(
    //   leaguesSelectorsOfGirlsSrcToModify,
    //   leaguesSelectorsOfGirlsAvatarsSrcToModify,
    //   leaguesSelectorsOfGirlsNumerousIconsSrcToModify,
    // );
  }

  if (window.location.href.includes('/league-battle.html')) {
    if (DEBUG_ACTIVATED) {
      console.log(' ');
      console.log('> LEAGUE BATTLE PAGE');
    }

    // processGirlImagesSrcToModify(
    //   leagueBattleSelectorsOfGirlsSrcToModify,
    //   leagueBattleSelectorsOfGirlsAvatarsSrcToModify,
    //   leagueBattleSelectorsOfGirlsNumerousIconsSrcToModify,
    // );
  }

  if (window.location.href.includes('/leagues-pre-battle.html')) {
    if (DEBUG_ACTIVATED) {
      console.log(' ');
      console.log('> LEAGUE PRE-BATTLE PAGE');
    }

    // processGirlImagesSrcToModify(
    //   leaguePreBattleSelectorsOfGirlsSrcToModify,
    //   leaguePreBattleSelectorsOfGirlsAvatarsSrcToModify,
    //   leaguePreBattleSelectorsOfGirlsNumerousIconsSrcToModify,
    // );
  }

  if (window.location.href.includes('/love-raids.html')) {
    if (DEBUG_ACTIVATED) {
      console.log(' ');
      console.log('> LOVE RAIDS PAGE');
    }

    // processGirlImagesSrcToModify(
    //   loveRaidsSelectorsOfGirlsSrcToModify,
    //   loveRaidsSelectorsOfGirlsAvatarsSrcToModify,
    //   loveRaidsSelectorsOfGirlsNumerousIconsSrcToModify,
    // );
  }

  if (window.location.href.includes('/member-progression.html')) {
    if (DEBUG_ACTIVATED) {
      console.log(' ');
      console.log('> MEMBER PROGRESSION PAGE');
    }
  }

  if (window.location.href.includes('/pachinko.html')) {
    if (DEBUG_ACTIVATED) {
      console.log(' ');
      console.log('> PACHINKO PAGE');
    }
  }

  if (window.location.href.includes('/pantheon.html')) {
    if (DEBUG_ACTIVATED) {
      console.log(' ');
      console.log('> PANTHEON PAGE');
    }

    processImagesSrcToHidePermanently(pantheonSelectorsOfImagesSrcToRemove);
    // processGirlImagesSrcToModify(
    //   pantheonSelectorsOfGirlsSrcToModify,
    //   pantheonSelectorsOfGirlsAvatarsSrcToModify,
    //   pantheonSelectorsOfGirlsNumerousIconsSrcToModify,
    // );
  }

  if (window.location.href.includes('/pantheon-battle.html')) {
    if (DEBUG_ACTIVATED) {
      console.log(' ');
      console.log('> PANTHEON BATTLE PAGE');
    }
    // processGirlImagesSrcToModify(
    //   pantheonBattleSelectorsOfGirlsSrcToModify,
    //   pantheonBattleSelectorsOfGirlsAvatarsSrcToModify,
    //   pantheonBattleSelectorsOfGirlsNumerousIconsSrcToModify,
    // );
  }

  if (window.location.href.includes('/pantheon-pre-battle.html')) {
    if (DEBUG_ACTIVATED) {
      console.log(' ');
      console.log('> PANTHEON PRE-BATTLE PAGE');
    }
    // processGirlImagesSrcToModify(
    //   pantheonPreBattleSelectorsOfGirlsSrcToModify,
    //   pantheonPreBattleSelectorsOfGirlsAvatarsSrcToModify,
    //   pantheonPreBattleSelectorsOfGirlsNumerousIconsSrcToModify,
    // );
  }

  if (window.location.href.includes('/path-of-glory.html')) {
    if (DEBUG_ACTIVATED) {
      console.log(' ');
      console.log('> PATH OF GLORY PAGE');
    }

    // processGirlImagesSrcToModify(
    //   pathOfGlorySelectorsOfGirlsSrcToModify,
    //   pathOfGlorySelectorsOfGirlsAvatarsSrcToModify,
    //   pathOfGlorySelectorsOfGirlsNumerousIconsSrcToModify,
    // );
  }

  if (window.location.href.includes('/path-of-valor.html')) {
    if (DEBUG_ACTIVATED) {
      console.log(' ');
      console.log('> PATH OF VALOR PAGE');
    }

    // processGirlImagesSrcToModify(
    //   pathOfValorSelectorsOfGirlsSrcToModify,
    //   pathOfValorSelectorsOfGirlsAvatarsSrcToModify,
    //   pathOfValorSelectorsOfGirlsNumerousIconsSrcToModify,
    // );
  }

  if (window.location.href.includes('/penta-drill.html')) {
    if (DEBUG_ACTIVATED) {
      console.log(' ');
      console.log('> PENTA DRILL PAGE');
    }

    // processGirlImagesSrcToModify(
    //   pentaDrillSelectorsOfGirlsSrcToModify,
    //   pentaDrillSelectorsOfGirlsAvatarsSrcToModify,
    //   pentaDrillSelectorsOfGirlsNumerousIconsSrcToModify,
    // );
  }

  if (window.location.href.includes('/penta-drill-arena.html')) {
    if (DEBUG_ACTIVATED) {
      console.log(' ');
      console.log('> PENTA DRILL ARENA PAGE');
    }

    // processGirlImagesSrcToModify(
    //   pentaDrillArenaSelectorsOfGirlsSrcToModify,
    //   pentaDrillArenaSelectorsOfGirlsAvatarsSrcToModify,
    //   pentaDrillArenaSelectorsOfGirlsNumerousIconsSrcToModify,
    // );
  }

  if (window.location.href.includes('/penta-drill-battle.html')) {
    if (DEBUG_ACTIVATED) {
      console.log(' ');
      console.log('> PENTA DRILL BATTLE PAGE');
    }

    // processGirlImagesSrcToModify(
    //   pentaDrillBattleSelectorsOfGirlsSrcToModify,
    //   pentaDrillBattleSelectorsOfGirlsAvatarsSrcToModify,
    //   pentaDrillBattleSelectorsOfGirlsNumerousIconsSrcToModify,
    // );
  }

  if (window.location.href.includes('/pvp-arena.html')) {
    if (DEBUG_ACTIVATED) {
      console.log(' ');
      console.log('> PVP ARENA PAGE');
    }

    // processGirlImagesSrcToModify(
    //   pvpArenaSelectorsOfGirlsSrcToModify,
    //   pvpArenaSelectorsOfGirlsAvatarsSrcToModify,
    //   pvpArenaSelectorsOfGirlsNumerousIconsSrcToModify,
    // );
  }

  if (window.location.href.includes('/season.html')) {
    if (DEBUG_ACTIVATED) {
      console.log(' ');
      console.log('> SEASON PAGE');
    }
    // processGirlImagesSrcToModify(
    //   seasonSelectorsOfGirlsSrcToModify,
    //   seasonSelectorsOfGirlsAvatarsSrcToModify,
    //   seasonSelectorsOfGirlsNumerousIconsSrcToModify,
    // );
  }

  if (window.location.href.includes('/season-arena.html')) {
    if (DEBUG_ACTIVATED) {
      console.log(' ');
      console.log('> SEASON ARENA PAGE');
    }
    // processGirlImagesSrcToModify(
    //   seasonArenaSelectorsOfGirlsSrcToModify,
    //   seasonArenaSelectorsOfGirlsAvatarsSrcToModify,
    //   seasonArenaSelectorsOfGirlsNumerousIconsSrcToModify,
    // );
  }

  if (window.location.href.includes('/season-battle.html')) {
    if (DEBUG_ACTIVATED) {
      console.log(' ');
      console.log('> SEASON BATTLE PAGE');
    }
    // processGirlImagesSrcToModify(
    //   seasonBattleSelectorsOfGirlsSrcToModify,
    //   seasonBattleSelectorsOfGirlsAvatarsSrcToModify,
    //   seasonBattleSelectorsOfGirlsNumerousIconsSrcToModify,
    // );
  }

  if (window.location.href.includes('/seasonal.html')) {
    if (DEBUG_ACTIVATED) {
      console.log(' ');
      console.log('> SEASONAL PAGE');
    }
    // processGirlImagesSrcToModify(
    //   seasonalSelectorsOfGirlsSrcToModify,
    //   seasonalSelectorsOfGirlsAvatarsSrcToModify,
    //   seasonalSelectorsOfGirlsNumerousIconsSrcToModify,
    // );
  }

  if (window.location.href.includes('/side-quests.html')) {
    if (DEBUG_ACTIVATED) {
      console.log(' ');
      console.log('> SIDE QUESTS PAGE');
    }
  }

  if (window.location.href.includes('/teams.html')) {
    if (DEBUG_ACTIVATED) {
      console.log(' ');
      console.log('> TEAMS PAGE');
    }
    // processGirlImagesSrcToModify(
    //   teamsSelectorsOfGirlsSrcToModify,
    //   teamsSelectorsOfGirlsAvatarsSrcToModify,
    //   teamsSelectorsOfGirlsNumerousIconsSrcToModify,
    // );
  }

  if (window.location.href.includes('/troll-battle.html')) {
    if (DEBUG_ACTIVATED) {
      console.log(' ');
      console.log('> TROLL BATTLE PAGE');
    }
    // processGirlImagesSrcToModify(
    //   trollBattleSelectorsOfGirlsSrcToModify,
    //   trollBattleSelectorsOfGirlsAvatarsSrcToModify,
    //   trollBattleSelectorsOfGirlsNumerousIconsSrcToModify,
    // );
  }

  if (window.location.href.includes('/troll-pre-battle.html')) {
    if (DEBUG_ACTIVATED) {
      console.log(' ');
      console.log('> TROLL PRE-BATTLE PAGE');
    }
    // processGirlImagesSrcToModify(
    //   trollPreBattleSelectorsOfGirlsSrcToModify,
    //   trollPreBattleSelectorsOfGirlsAvatarsSrcToModify,
    //   trollPreBattleSelectorsOfGirlsNumerousIconsSrcToModify,
    // );
  }

  if (window.location.href.includes('/world/')) {
    if (DEBUG_ACTIVATED) {
      console.log(' ');
      console.log('> WORLD PAGE');
    }
  }

  if (window.location.href.includes('/world-boss-battle.html')) {
    if (DEBUG_ACTIVATED) {
      console.log(' ');
      console.log('> WORLD BOSS BATTLE PAGE');
    }

    // processGirlImagesSrcToModify(
    //   worldBossBattleSelectorsOfGirlsSrcToModify,
    //   worldBossBattleSelectorsOfGirlsAvatarsSrcToModify,
    //   worldBossBattleSelectorsOfGirlsNumerousIconsSrcToModify,
    // );
  }

  if (window.location.href.includes('/world-boss-event')) {
    if (DEBUG_ACTIVATED) {
      console.log(' ');
      console.log('> WORLD BOSS EVENT PAGE');
    }
  }

  if (window.location.href.includes('/world-boss-pre-battle')) {
    if (DEBUG_ACTIVATED) {
      console.log(' ');
      console.log('> WORLD BOSS PRE-BATTLE PAGE');
    }

    // processGirlImagesSrcToModify(
    //   worldBossEventPreBattleSelectorsOfGirlsSrcToModify,
    //   worldBossEventPreBattleSelectorsOfGirlsAvatarsSrcToModify,
    //   worldBossEventPreBattleSelectorsOfGirlsNumerousIconsSrcToModify,
    // );
  }
}

function modifyMedias() {
  if (DEBUG_LIMIT_ACTIVATED) {
    debugModifyLimitCount++;
    if (debugModifyLimitCount > 3) {
      DEBUG_ACTIVATED = false;
    }
  }

  if (DEBUG_ACTIVATED) {
    console.log(' ');
    console.log('> ALL PAGES');
  }
  if (REPLACE_BACKGROUND && !HIDE_BACKGROUND) {
    processImagesSrcToReplace(['.fixed_scaled > img'], NEW_BACKGROUNG_URL);
  }

  if (window.location.href.includes('/activities.html')) {
    foundMatchingUrl = true;
    if (DEBUG_ACTIVATED) {
      console.log(' ');
      console.log('> ACTIVITIES PAGE');
    }

    processGirlImagesSrcToModify(
      activitiesSelectorsOfGirlsSrcToModify,
      activitiesSelectorsOfGirlsAvatarsSrcToModify,
      activitiesSelectorsOfGirlsNumerousIconsSrcToModify,
    );
  }

  if (window.location.href.includes('/adventures.html')) {
    foundMatchingUrl = true;
    if (DEBUG_ACTIVATED) {
      console.log(' ');
      console.log('> ADVENTURES PAGE');
    }

    processGirlImagesSrcToModify(
      adventuresSelectorsOfGirlsSrcToModify,
      adventuresSelectorsOfGirlsAvatarsSrcToModify,
      adventuresSelectorsOfGirlsNumerousIconsSrcToModify,
    );
  }

  if (window.location.href.includes('/champions/')) {
    foundMatchingUrl = true;
    if (DEBUG_ACTIVATED) {
      console.log(' ');
      console.log('> CHAMPIONS PAGE');
    }

    processGirlImagesSrcToModify(
      championSelectorsOfGirlsSrcToModify,
      championSelectorsOfGirlsAvatarsSrcToModify,
      championSelectorsOfGirlsNumerousIconsSrcToModify,
    );
  }

  if (window.location.href.includes('/characters/')) {
    foundMatchingUrl = true;
    if (DEBUG_ACTIVATED) {
      console.log(' ');
      console.log('> CHARACTERS PAGE');
    }

    processGirlImagesSrcToModify(
      charactersSelectorsOfGirlsSrcToModify,
      charactersSelectorsOfGirlsAvatarsSrcToModify,
      charactersSelectorsOfGirlsNumerousIconsSrcToModify,
    );
  }

  if (window.location.href.includes('/club-champion.html')) {
    foundMatchingUrl = true;
    if (DEBUG_ACTIVATED) {
      console.log(' ');
      console.log('> CLUB CHAMPION PAGE');
    }

    processGirlImagesSrcToModify(
      clubChampionSelectorsOfGirlsSrcToModify,
      clubChampionSelectorsOfGirlsAvatarsSrcToModify,
      clubChampionSelectorsOfGirlsNumerousIconsSrcToModify,
    );
  }

  if (window.location.href.includes('/edit-labyrinth-team.html')) {
    foundMatchingUrl = true;
    if (DEBUG_ACTIVATED) {
      console.log(' ');
      console.log('> EDIT LABYRINTH TEAM PAGE');
    }

    processGirlImagesSrcToModify(
      editLabyrinthTeamSelectorsOfGirlsSrcToModify,
      editLabyrinthTeamSelectorsOfGirlsAvatarsSrcToModify,
      editLabyrinthTeamSelectorsOfGirlsNumerousIconsSrcToModify,
    );
  }

  if (window.location.href.includes('/edit-team.html')) {
    foundMatchingUrl = true;
    if (DEBUG_ACTIVATED) {
      console.log(' ');
      console.log('> EDIT TEAM PAGE');
    }

    processGirlImagesSrcToModify(
      editTeamSelectorsOfGirlsSrcToModify,
      editTeamSelectorsOfGirlsAvatarsSrcToModify,
      editTeamSelectorsOfGirlsNumerousIconsSrcToModify,
    );
  }

  if (window.location.href.includes('/edit-world-boss-team.html')) {
    foundMatchingUrl = true;
    if (DEBUG_ACTIVATED) {
      console.log(' ');
      console.log('> EDIT WORLD BOSS TEAM PAGE');
    }

    processGirlImagesSrcToModify(
      editWorldBossTeamSelectorsOfGirlsSrcToModify,
      editWorldBossTeamSelectorsOfGirlsAvatarsSrcToModify,
      editWorldBossTeamSelectorsOfGirlsNumerousIconsSrcToModify,
    );
  }

  if (window.location.href.includes('/event.html')) {
    foundMatchingUrl = true;
    if (DEBUG_ACTIVATED) {
      console.log(' ');
      console.log('> EVENT PAGE');
    }

    processGirlImagesSrcToModify(
      eventSelectorsOfGirlsSrcToModify,
      eventSelectorsOfGirlsAvatarsSrcToModify,
      eventSelectorsOfGirlsNumerousIconsSrcToModify,
    );
  }

  if (window.location.href.includes('/girl/')) {
    foundMatchingUrl = true;
    if (DEBUG_ACTIVATED) {
      console.log(' ');
      console.log('> GIRL PAGE');
    }

    processGirlImagesSrcToModify(
      girlSelectorsOfGirlsSrcToModify,
      girlSelectorsOfGirlsAvatarsSrcToModify,
      girlSelectorsOfGirlsNumerousIconsSrcToModify,
    );
  }

  if (window.location.href.includes('/god-path.html')) {
    foundMatchingUrl = true;
    if (DEBUG_ACTIVATED) {
      console.log(' ');
      console.log('> GOD PATH PAGE');
    }

    processGirlImagesSrcToModify(
      godPathSelectorsOfGirlsSrcToModify,
      godPathSelectorsOfGirlsAvatarsSrcToModify,
      godPathSelectorsOfGirlsNumerousIconsSrcToModify,
    );
  }

  if (window.location.href.includes('/home.html')) {
    foundMatchingUrl = true;
    if (DEBUG_ACTIVATED) {
      console.log(' ');
      console.log('> HOME PAGE');
    }

    processGirlImagesSrcToModify(
      homeSelectorsOfGirlsSrcToModify,
      homeSelectorsOfGirlsAvatarsSrcToModify,
      homeSelectorsOfGirlsNumerousIconsSrcToModify,
    );
  }

  if (window.location.href.includes('/labyrinth.html')) {
    foundMatchingUrl = true;
    if (DEBUG_ACTIVATED) {
      console.log(' ');
      console.log('> LABYRINTH PAGE');
    }

    processGirlImagesSrcToModify(
      labyrinthSelectorsOfGirlsSrcToModify,
      labyrinthSelectorsOfGirlsAvatarsSrcToModify,
      labyrinthSelectorsOfGirlsNumerousIconsSrcToModify,
    );
  }

  if (window.location.href.includes('/labyrinth-battle.html')) {
    foundMatchingUrl = true;
    if (DEBUG_ACTIVATED) {
      console.log(' ');
      console.log('> LABYRINTH BATTLE PAGE');
    }

    processGirlImagesSrcToModify(
      labyrinthBattleSelectorsOfGirlsSrcToModify,
      labyrinthBattleSelectorsOfGirlsAvatarsSrcToModify,
      labyrinthBattleSelectorsOfGirlsNumerousIconsSrcToModify,
    );
  }

  if (window.location.href.includes('/labyrinth-entrance.html')) {
    foundMatchingUrl = true;
    if (DEBUG_ACTIVATED) {
      console.log(' ');
      console.log('> LABYRINTH ENTRANCE PAGE');
    }

    processGirlImagesSrcToModify(
      labyrinthEntranceSelectorsOfGirlsSrcToModify,
      labyrinthEntranceSelectorsOfGirlsAvatarsSrcToModify,
      labyrinthEntranceSelectorsOfGirlsNumerousIconsSrcToModify,
    );
  }

  if (window.location.href.includes('/labyrinth-pool-select.html')) {
    foundMatchingUrl = true;
    if (DEBUG_ACTIVATED) {
      console.log(' ');
      console.log('> LABYRINTH POOL SELECT PAGE');
    }

    processGirlImagesSrcToModify(
      labyrinthPoolSelectSelectorsOfGirlsSrcToModify,
      labyrinthPoolSelectSelectorsOfGirlsSrcToModify,
      labyrinthPoolSelectSelectorsOfGirlsNumerousIconsSrcToModify,
    );
  }

  if (window.location.href.includes('/labyrinth-pre-battle.html')) {
    foundMatchingUrl = true;
    if (DEBUG_ACTIVATED) {
      console.log(' ');
      console.log('> LABYRINTH PRE-BATTLE PAGE');
    }

    processGirlImagesSrcToModify(
      labyrinthPreBattleSelectorsOfGirlsSrcToModify,
      labyrinthPreBattleSelectorsOfGirlsAvatarsSrcToModify,
      labyrinthPreBattleSelectorsOfGirlsNumerousIconsSrcToModify,
    );
  }

  if (window.location.href.includes('/leagues.html')) {
    foundMatchingUrl = true;
    if (DEBUG_ACTIVATED) {
      console.log(' ');
      console.log('> LEAGUES PAGE');
    }

    processGirlImagesSrcToModify(
      leaguesSelectorsOfGirlsSrcToModify,
      leaguesSelectorsOfGirlsAvatarsSrcToModify,
      leaguesSelectorsOfGirlsNumerousIconsSrcToModify,
    );
  }

  if (window.location.href.includes('/league-battle.html')) {
    foundMatchingUrl = true;
    if (DEBUG_ACTIVATED) {
      console.log(' ');
      console.log('> LEAGUE BATTLE PAGE');
    }

    processGirlImagesSrcToModify(
      leagueBattleSelectorsOfGirlsSrcToModify,
      leagueBattleSelectorsOfGirlsAvatarsSrcToModify,
      leagueBattleSelectorsOfGirlsNumerousIconsSrcToModify,
    );
  }

  if (window.location.href.includes('/leagues-pre-battle.html')) {
    foundMatchingUrl = true;
    if (DEBUG_ACTIVATED) {
      console.log(' ');
      console.log('> LEAGUE PRE-BATTLE PAGE');
    }

    processGirlImagesSrcToModify(
      leaguePreBattleSelectorsOfGirlsSrcToModify,
      leaguePreBattleSelectorsOfGirlsAvatarsSrcToModify,
      leaguePreBattleSelectorsOfGirlsNumerousIconsSrcToModify,
    );
  }

  if (window.location.href.includes('/love-raids.html')) {
    if (DEBUG_ACTIVATED) {
      console.log(' ');
      console.log('> LOVE RAIDS PAGE');
    }

    processGirlImagesSrcToModify(
      loveRaidsSelectorsOfGirlsSrcToModify,
      loveRaidsSelectorsOfGirlsAvatarsSrcToModify,
      loveRaidsSelectorsOfGirlsNumerousIconsSrcToModify,
    );
  }

  if (window.location.href.includes('/member-progression.html')) {
    foundMatchingUrl = true;
    if (DEBUG_ACTIVATED) {
      console.log(' ');
      console.log('> MEMBER PROGRESSION PAGE');
    }

    processGirlImagesSrcToModify(
      memberProgressionSelectorsOfGirlsSrcToModify,
      memberProgressionSelectorsOfGirlsAvatarsSrcToModify,
      memberProgressionSelectorsOfGirlsNumerousIconsSrcToModify,
    );
  }

  if (window.location.href.includes('/pachinko.html')) {
    foundMatchingUrl = true;
    if (DEBUG_ACTIVATED) {
      console.log(' ');
      console.log('> PACHINKO PAGE');
    }

    processGirlImagesSrcToModify(
      pachinkoSelectorsOfGirlsSrcToModify,
      pachinkoSelectorsOfGirlsAvatarsSrcToModify,
      pachinkoSelectorsOfGirlsNumerousIconsSrcToModify,
    );
  }

  if (window.location.href.includes('/pantheon.html')) {
    foundMatchingUrl = true;
    if (DEBUG_ACTIVATED) {
      console.log(' ');
      console.log('> PANTHEON PAGE');
    }

    processGirlImagesSrcToModify(
      pantheonSelectorsOfGirlsSrcToModify,
      pantheonSelectorsOfGirlsAvatarsSrcToModify,
      pantheonSelectorsOfGirlsNumerousIconsSrcToModify,
    );
  }

  if (window.location.href.includes('/pantheon-battle.html')) {
    foundMatchingUrl = true;
    if (DEBUG_ACTIVATED) {
      console.log(' ');
      console.log('> PANTHEON BATTLE PAGE');
    }

    processGirlImagesSrcToModify(
      pantheonBattleSelectorsOfGirlsSrcToModify,
      pantheonBattleSelectorsOfGirlsAvatarsSrcToModify,
      pantheonBattleSelectorsOfGirlsNumerousIconsSrcToModify,
    );
  }

  if (window.location.href.includes('/pantheon-pre-battle.html')) {
    foundMatchingUrl = true;
    if (DEBUG_ACTIVATED) {
      console.log(' ');
      console.log('> PANTHEON PRE-BATTLE PAGE');
    }

    processGirlImagesSrcToModify(
      pantheonPreBattleSelectorsOfGirlsSrcToModify,
      pantheonPreBattleSelectorsOfGirlsAvatarsSrcToModify,
      pantheonPreBattleSelectorsOfGirlsNumerousIconsSrcToModify,
    );
  }

  if (window.location.href.includes('/path-of-glory.html')) {
    if (DEBUG_ACTIVATED) {
      console.log(' ');
      console.log('> PATH OF GLORY PAGE');
    }

    processGirlImagesSrcToModify(
      pathOfGlorySelectorsOfGirlsSrcToModify,
      pathOfGlorySelectorsOfGirlsAvatarsSrcToModify,
      pathOfGlorySelectorsOfGirlsNumerousIconsSrcToModify,
    );
  }

  if (window.location.href.includes('/path-of-valor.html')) {
    if (DEBUG_ACTIVATED) {
      console.log(' ');
      console.log('> PATH OF VALOR PAGE');
    }

    processGirlImagesSrcToModify(
      pathOfValorSelectorsOfGirlsSrcToModify,
      pathOfValorSelectorsOfGirlsAvatarsSrcToModify,
      pathOfValorSelectorsOfGirlsNumerousIconsSrcToModify,
    );
  }

  if (window.location.href.includes('/penta-drill.html')) {
    if (DEBUG_ACTIVATED) {
      console.log(' ');
      console.log('> PENTA DRILL PAGE');
    }

    processGirlImagesSrcToModify(
      pentaDrillSelectorsOfGirlsSrcToModify,
      pentaDrillSelectorsOfGirlsAvatarsSrcToModify,
      pentaDrillSelectorsOfGirlsNumerousIconsSrcToModify,
    );
  }

  if (window.location.href.includes('/penta-drill-arena.html')) {
    if (DEBUG_ACTIVATED) {
      console.log(' ');
      console.log('> PENTA DRILL ARENA PAGE');
    }

    processGirlImagesSrcToModify(
      pentaDrillArenaSelectorsOfGirlsSrcToModify,
      pentaDrillArenaSelectorsOfGirlsAvatarsSrcToModify,
      pentaDrillArenaSelectorsOfGirlsNumerousIconsSrcToModify,
    );
  }

  if (window.location.href.includes('/penta-drill-battle.html')) {
    if (DEBUG_ACTIVATED) {
      console.log(' ');
      console.log('> PENTA DRILL BATTLE PAGE');
    }

    processGirlImagesSrcToModify(
      pentaDrillBattleSelectorsOfGirlsSrcToModify,
      pentaDrillBattleSelectorsOfGirlsAvatarsSrcToModify,
      pentaDrillBattleSelectorsOfGirlsNumerousIconsSrcToModify,
    );
  }

  if (window.location.href.includes('/pvp-arena.html')) {
    if (DEBUG_ACTIVATED) {
      console.log(' ');
      console.log('> PVP ARENA PAGE');
    }

    processGirlImagesSrcToModify(
      pvpArenaSelectorsOfGirlsSrcToModify,
      pvpArenaSelectorsOfGirlsAvatarsSrcToModify,
      pvpArenaSelectorsOfGirlsNumerousIconsSrcToModify,
    );
  }

  if (window.location.href.includes('/season.html')) {
    foundMatchingUrl = true;
    if (DEBUG_ACTIVATED) {
      console.log(' ');
      console.log('> SEASON PAGE');
    }

    processGirlImagesSrcToModify(
      seasonSelectorsOfGirlsSrcToModify,
      seasonSelectorsOfGirlsAvatarsSrcToModify,
      seasonSelectorsOfGirlsNumerousIconsSrcToModify,
    );
  }

  if (window.location.href.includes('/season-arena.html')) {
    foundMatchingUrl = true;
    if (DEBUG_ACTIVATED) {
      console.log(' ');
      console.log('> SEASON ARENA PAGE');
    }

    processGirlImagesSrcToModify(
      seasonArenaSelectorsOfGirlsSrcToModify,
      seasonArenaSelectorsOfGirlsAvatarsSrcToModify,
      seasonArenaSelectorsOfGirlsNumerousIconsSrcToModify,
    );
  }

  if (window.location.href.includes('/season-battle.html')) {
    foundMatchingUrl = true;
    if (DEBUG_ACTIVATED) {
      console.log(' ');
      console.log('> SEASON BATTLE PAGE');
    }

    processGirlImagesSrcToModify(
      seasonBattleSelectorsOfGirlsSrcToModify,
      seasonBattleSelectorsOfGirlsAvatarsSrcToModify,
      seasonBattleSelectorsOfGirlsNumerousIconsSrcToModify,
    );
  }

  if (window.location.href.includes('/seasonal.html')) {
    foundMatchingUrl = true;
    if (DEBUG_ACTIVATED) {
      console.log(' ');
      console.log('> SEASONAL PAGE');
    }

    processGirlImagesSrcToModify(
      seasonalSelectorsOfGirlsSrcToModify,
      seasonalSelectorsOfGirlsAvatarsSrcToModify,
      seasonalSelectorsOfGirlsNumerousIconsSrcToModify,
    );
  }

  if (window.location.href.includes('/side-quests.html')) {
    foundMatchingUrl = true;
    if (DEBUG_ACTIVATED) {
      console.log(' ');
      console.log('> SIDE QUESTS PAGE');
    }

    processGirlImagesSrcToModify(
      sideQuestsSelectorsOfGirlsSrcToModify,
      sideQuestsSelectorsOfGirlsAvatarsSrcToModify,
      sideQuestsSelectorsOfGirlsNumerousIconsSrcToModify,
    );
  }

  if (window.location.href.includes('/teams.html')) {
    foundMatchingUrl = true;
    if (DEBUG_ACTIVATED) {
      console.log(' ');
      console.log('> TEAMS PAGE');
    }

    processGirlImagesSrcToModify(
      teamsSelectorsOfGirlsSrcToModify,
      teamsSelectorsOfGirlsAvatarsSrcToModify,
      teamsSelectorsOfGirlsNumerousIconsSrcToModify,
    );
  }

  if (window.location.href.includes('/troll-battle.html')) {
    foundMatchingUrl = true;
    if (DEBUG_ACTIVATED) {
      console.log(' ');
      console.log('> TROLL BATTLE PAGE');
    }

    processGirlImagesSrcToModify(
      trollBattleSelectorsOfGirlsSrcToModify,
      trollBattleSelectorsOfGirlsAvatarsSrcToModify,
      trollBattleSelectorsOfGirlsNumerousIconsSrcToModify,
    );
  }

  if (window.location.href.includes('/troll-pre-battle.html')) {
    foundMatchingUrl = true;
    if (DEBUG_ACTIVATED) {
      console.log(' ');
      console.log('> TROLL PRE-BATTLE PAGE');
    }

    processGirlImagesSrcToModify(
      trollPreBattleSelectorsOfGirlsSrcToModify,
      trollPreBattleSelectorsOfGirlsAvatarsSrcToModify,
      trollPreBattleSelectorsOfGirlsNumerousIconsSrcToModify,
    );
  }

  if (window.location.href.includes('/world/')) {
    foundMatchingUrl = true;
    if (DEBUG_ACTIVATED) {
      console.log(' ');
      console.log('> WORLD PAGE');
    }

    processGirlImagesSrcToModify(
      worldSelectorsOfGirlsSrcToModify,
      worldSelectorsOfGirlsAvatarsSrcToModify,
      worldSelectorsOfGirlsNumerousIconsSrcToModify,
    );
  }

  if (window.location.href.includes('/world-boss-battle.html')) {
    foundMatchingUrl = true;
    if (DEBUG_ACTIVATED) {
      console.log(' ');
      console.log('> WORLD BOSS BATTLE PAGE');
    }

    processGirlImagesSrcToModify(
      worldBossBattleSelectorsOfGirlsSrcToModify,
      worldBossBattleSelectorsOfGirlsAvatarsSrcToModify,
      worldBossBattleSelectorsOfGirlsNumerousIconsSrcToModify,
    );
  }

  if (window.location.href.includes('/world-boss-event')) {
    foundMatchingUrl = true;
    if (DEBUG_ACTIVATED) {
      console.log(' ');
      console.log('> WORLD BOSS EVENT PAGE');
    }

    processGirlImagesSrcToModify(
      worldBossEventSelectorsOfGirlsSrcToModify,
      worldBossEventSelectorsOfGirlsAvatarsSrcToModify,
      worldBossEventSelectorsOfGirlsNumerousIconsSrcToModify,
    );
  }

  if (window.location.href.includes('/world-boss-pre-battle')) {
    foundMatchingUrl = true;
    if (DEBUG_ACTIVATED) {
      console.log(' ');
      console.log('> WORLD BOSS PRE-BATTLE PAGE');
    }

    processGirlImagesSrcToModify(
      worldBossEventPreBattleSelectorsOfGirlsSrcToModify,
      worldBossEventPreBattleSelectorsOfGirlsAvatarsSrcToModify,
      worldBossEventPreBattleSelectorsOfGirlsNumerousIconsSrcToModify,
    );
  }

  if (!foundMatchingUrl) {
    if (DEBUG_ACTIVATED) {
      console.log('> ');
      console.log('> NO MATCHING URL FOUND (killing observer...)');
    }
    if (killObserverCount < killObserverDelay) {
      killObserverCount++;
      resetObserverState();
    } else {
      killObserver();
    }
  }
}

hideMedias();

// DOM is ready, resources may still be loading
document.addEventListener('DOMContentLoaded', function () {
  if (DEBUG_ACTIVATED) {
    console.log('> ');
    console.log('> DOMContentLoaded');
  }
  hideMediasTemporarily();
  initObserver();
});

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
      processImagesToShowAgain(questSelectorsOfImagesToHide);
    }
  } else {
    // initObserver();
    modifyMedias();
  }
});

// TODO replace killObserver with resetObserver
// TODO implement count of img processed and compare it with the total number of images (if < then process imgs)
// // Add event listener for scrolling on desktop
// document.addEventListener('wheel', function (event) {
//   killObserver();
//   initObserver();
// });
//
// // Add event listener for scrolling on mobile
// document.addEventListener('touchmove', function (event) {
//   killObserver();
//   initObserver();
// });

