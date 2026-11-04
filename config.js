// Choose featured repos and optionally give them a shorter display title.
// Descriptions and repository metadata come from GitHub, with optional language overrides.
window.PORTFOLIO_CONFIG = {
  username: 'ppatel2612',
  // Use exact repository names. These labels also apply to search and filters.
  // Add a Verilog project as: 'your-repository-name': 'Verilog'
  languageOverrides: {
    'CPU-Built-With-VHDL': 'VHDL',
    'CPU-Components-In-VHDL': 'VHDL',
    'Basic-Components-in-VHDL': 'VHDL'
  },
  featured: [
    { repo: 'Hostage-Chess-Server', title: 'Hostage Chess', category: 'WEB APPLICATION', artwork: 'chess', symbol: '♞' },
    { repo: 'Accuracy-Interpretability-and-Stability-Trade-offs-in-Feature-Selected-Neuro-Fuzzy-Classifiers', title: 'Neuro-Fuzzy Classifiers', category: 'MACHINE LEARNING RESEARCH', artwork: 'research', symbol: 'ƒ(x)' },
    { repo: 'CPU-Built-With-VHDL', title: 'A CPU, Built in VHDL', category: 'COMPUTER ARCHITECTURE', artwork: 'hardware', symbol: '01' }
  ]
};
