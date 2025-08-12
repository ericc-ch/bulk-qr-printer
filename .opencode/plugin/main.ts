import { compose } from 'opencode-plugin-compose';
import { forceAgent } from 'opencode-plugin-copilot';
import { notification } from 'opencode-plugin-notification';

export const plugins = compose([
	notification({
		idleTime: 1000 * 60 * 5
	}),
	forceAgent()
]);
