// Constantes de jogo. Ajuste aqui para mexer em ritmo, hitbox e tamanho da rua
// sem caçar número mágico pelo resto do código.

export const VERSION = '0.2.0-beta';

// Três faixas. O espaço entre centros cabe um ônibus sem invadir a faixa vizinha.
export const LANE_X = [-2.6, 0, 2.6];
export const ROAD_W = 8.2;
export const SIDE_W = 3.5;
export const CHUNK_LEN = 56;
export const CHUNK_COUNT = 5;

export const BASE_SPEED = 14;
export const MAX_SPEED = 32;

export const JUMP_HEIGHT = 2.2;
export const JUMP_DURATION = 0.78;
// Acima disso o pé passa o buraco. Janela calculada em logic.js.
export const JUMP_CLEAR_Y = 0.92;

// Hitbox menor que o visual, de propósito: quase-acidente tem que parecer justo.
export const PLAYER_HW = 0.38;
export const PLAYER_HD = 0.36;

export const SPAWN_AHEAD = 60;
export const SCORE_STEP = 100;

export const NEAR_MISS_BONUS = 25;
