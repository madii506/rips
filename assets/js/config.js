// RIPS settings. Fill ca and x at launch; everything else on the page reads from here.
window.RIPS = {
  ca: '',          // the $RIPS mint address
  x: '',           // X handle without @
  ticker: 'RIPS',
  ripUsd: 2,       // a rip burns this many dollars of $RIPS
  pity: 100,       // odds double after this many rips without a tear
  seedHash: '',    // the current pack's committed seed hash
};
