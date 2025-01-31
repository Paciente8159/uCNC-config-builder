onmessage = function(e) {
	const { action, data } = e.data;
	
	switch(action) {
			case 'parse_json':
					try {
							const build = JSON.parse(data);
							self.postMessage({
									action: 'update_scope',
									result: build
							});
					} catch (error) {
							console.error('JSON parsing error:', error);
							self.postMessage({
									action: 'error',
									message: 'Error parsing JSON file'
							});
					}
					break;
	}
}
