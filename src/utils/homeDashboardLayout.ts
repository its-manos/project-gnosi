/** Home's vertical budget, in points. Compact cards before reducing artwork.
 * Heights are minimums, never clipping bounds: large text can still scroll.
 */
export function homeDashboardLayout(height: number, width: number, fontScale = 1) {
  const preferredIcon = Math.min(46, Math.floor(((Math.min(width, 620) - 32) * 0.227 - 6) / 1.18));
  const fullIcon = Math.max(28, preferredIcon);
  // Header, Mini Games heading/card, section gaps, outer padding and worlds
  // heading/row gap. Each world row reserves two lines for its longest label.
  const fixed = 52 + 86 + 32 + 8 + 32;
  const worldRows = (icon: number) => 2 * (Math.ceil(icon * 1.18) + 28 + 9);
  const minimumCards = 162 + 82;
  const preferredCards = 230 + 110;
  const cardRoom = height - fixed - worldRows(fullIcon);
  const compression = Math.max(0, Math.min(1,
    (preferredCards - cardRoom) / (preferredCards - minimumCards)));
  let iconSize = fullIcon;
  // Artwork only yields after every card has reached its compact minimum.
  while (iconSize > 28 && fixed + worldRows(iconSize) + minimumCards > height) iconSize--;
  const heroHeight = Math.round(230 - 68 * compression);
  const quizHeight = Math.round(110 - 28 * compression);
  return {
    iconSize, platformSize: Math.ceil(iconSize * 1.18), heroHeight, quizHeight,
    density: compression >= 0.8 ? 2 : compression > 0 ? 1 : 0,
    estimatedHeight: fixed + worldRows(iconSize) + heroHeight + quizHeight,
    naturalText: fontScale > 1.15,
  };
}
