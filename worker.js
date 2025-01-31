onmessage = async function(e) {
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
			case 'parse_prebuild':
						try {
							var response = await fetch(data);
							if (response.ok) {
									const build = await response.json();
									self.postMessage({
										action: 'update_prebuild',
										result: build
								});
							}
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
