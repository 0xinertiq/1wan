// Round 13: the Dungeon's room banner, a cosy stone study with Sisi at her journal. The same 400 x 60 grid as
// Momo's clock tower (rooms.ts), so the two banners share one size. Code-drawn pixel art, rows of palette letters:
// plum outline #4a2538, soft lavender stone, candlelight in peach and cream, and one gold accent (the journal's
// ribbon). Generated rows, kept here as data.
import { ROOM_PAL } from "./rooms";
import type { Sprite } from "./scenes";

// pixel-art palette (Dungeon room only), over the clock tower's
export const DUN_PAL: Record<string, string> = { ...ROOM_PAL, F: "#FFC9A3", n: "#5B4570" };
// stone, floor and window glass by Singapore time. pixel-art
export const DUN_WALL = {
  day: { wall: "#EDE6F4", stone: "#DCD2EA", floor: "#CDBFDD", flag: "#B7A7CC", glass: ["#FBE3F1", "#EEDCFA", "#DDE6FF"] },
  dusk: { wall: "#E4D8EC", stone: "#D2C2E0", floor: "#C2B0D4", flag: "#A996C0", glass: ["#D7A9DA", "#F2B3CF", "#FFDDBE"] },
  night: { wall: "#3E345E", stone: "#4A3F6D", floor: "#4F426E", flag: "#3A3058", glass: ["#2A2340", "#30294A", "#3A3058"] },
};

/** Sisi's writing desk with her open journal (gold ribbon), ink pot, quill and a candle, 30 x 12 */
export const sisiDesk: Sprite = [".......................pp..F..", "....XXXXXXXXXXXXXXXX...p..FoF.", "....XovovovoXovovooX.XXX..XXX.", "....XoroorooXgororoX.XnX..XoX.", "XXXXXXXXXXXXXgXXXXXXXXXXXXXXXX", "XddddddddddddgdddddddddddddddX", "XXXXXXXXXXXXXXXXXXXXXXXXXXXXXX", ".XbX.....XXXXXXXXXXXX....XbX..", ".XbX.....XssssXXssssX....XbX..", ".XbX.....XXXXXXXXXXXX....XbX..", ".XbX.....................XbX..", ".XXX.....................XXX.."];
/** a wall sconce candle, 5 x 10 */
export const sconce: Sprite = ["..F..", ".FoF.", "..X..", ".XXX.", ".XoX.", ".XoX.", ".XXX.", "XXXXX", ".XbX.", "..X.."];
/** a standing candelabra, 11 x 22 */
export const candelabra: Sprite = [".....F.....", ".....o.....", "....XoX....", ".F..XoX..F.", ".o..XoX..o.", "XoX.XoX.XoX", "XoX.....XoX", "XoX.....XoX", "XoX.....XoX", "XXXXXXXXXXX", "....XkX....", "....XkX....", "....XkX....", "....XkX....", "....XkX....", "....XkX....", "....XkX....", "....XkX....", "....XkX....", "....XkX....", "..XkkkkkX..", "..XXXXXXX.."];
/** a little wall shelf of jars, 22 x 10 */
export const jarShelf: Sprite = [".......XX........XX...", "..XX..XXXX......XXXX..", ".XXXX.XccX...XX.XwwX..", ".XllX.XccX..XXXXXwwX..", ".XllX.XccX..XvvXXwwX..", ".XllX.XccX..XvvXXwwX..", ".XllX.XccX..XvvXXwwX..", "XXXXXXXXXXXXXXXXXXXXXX", "XbbbbbbbbbbbbbbbbbbbbX", "..X................X.."];
/** a stone arch window, 14 x 18 (G = glass) */
export const archWindow: Sprite = ["....XXXXXX....", "..XXGGGGGGXX..", ".XGGGGGXGGGGX.", "XGGGGGGXGGGGGX", "XGGGGGGXGGGGGX", "XGGGoGGXGGGGGX", "XGGGGGGXGGGGGX", "XGGGGGGXGGGGGX", "XXXXXXXXXXXXXX", "XGGGGGGXGGGGGX", "XGGGGGGXGGGGGX", "XGGGGGGXGGGGGX", "XGGGGGGXGGGGGX", "XGGGGGGXGGGGGX", "XGGGGGGXGGGGGX", "XXXXXXXXXXXXXX", "XssssssssssssX", "XXXXXXXXXXXXXX"];
