// Portal patching utility for batch updates across all portal files
const fs = require('fs');
const path = require('path');

const portals = ['ceo','cro','cfo','coo','cs','cto','cmo','cpo'];
const files = portals.map(p => `${p}.html`);

console.log('Portal patcher ready. Files:', files.join(', '));