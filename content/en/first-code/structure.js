const path = require('path');
const here = `${path.parse(__dirname).base}${path.sep}`;
module.exports = [
    `${here}introduction`,
    `${here}your-state-contract`,
    `${here}solution-state`,
    `${here}solution-contract`,
    `${here}your-flow`,
    `${here}solution-flows-issue`,
    `${here}solution-flows-move`,
    `${here}solution-flows-redeem`
];
