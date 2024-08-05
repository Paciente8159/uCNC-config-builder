const boardloaded = new Event('boardloaded');
const halloaded = new Event('halloaded');
const toolloaded = new Event('toolloaded');

var loadingfile = false;

function ready(fn) {
	if (document.readyState !== 'loading') {
		fn();
	} else {
		document.addEventListener('DOMContentLoaded', fn);
	}
}

function parsePreprocessor(file, settings = [], callback) {
	if (loadingfile) {
		return;
	}
	document.getElementById('reloading').style.display = "block";
	const defineregex = /^[\s]*#define[\s]+(?<def>[\w\d]+)[\s]+(?<val>[\-\w\d\.]+|"[^"]+")?/gm
	var txtFile = new XMLHttpRequest();
	txtFile.open("GET", file, true);
	txtFile.onreadystatechange = function () {
		if (txtFile.readyState === 4 && txtFile.status === 200) {  // Makes sure it's found the file.
			allText = txtFile.responseText;
			const matches = [...allText.matchAll(defineregex)];
			for (var i = 0; i < matches.length; i++) {
				settings[matches[i][1]] = matches[i][2];
			}
			if (callback) {
				setTimeout(function () {
					callback(settings)
				}.bind(settings), 10);
			}
		}

	}
	txtFile.onerror = function () {
	}
	txtFile.send(null);
}

function getScope(node = null, final = true) {
	if (!node) {
		return null;
	}

	var val;
	var scope = angular.element(node).scope();
	var notempty = node.classList.contains('ng-not-empty');

	if (node.hasAttribute('model-scope-name')) {
		var arr = node.getAttribute('model-scope-name').split('.');
		switch (arr.length) {
			case 1:
				val = (notempty) ? scope[arr[0]] : null;
				break;
			case 2:
				val = (notempty) ? scope[arr[0]][arr[1]] : null;
				break;
			case 3:
				val = (notempty) ? scope[arr[0]][arr[1]][arr[2]] : null;
				break;
			case 4:
				val = (notempty) ? scope[arr[0]][arr[1]][arr[2]][arr[3]] : null;
				break;
			default:
				val = scope[node.id];
				break;

		}
	}
	else {
		val = (notempty) ? scope[node.id] : null;
	}

	return (final && (typeof val !== 'object')) ? val : null;
}

function updateScope(node = null, val = null) {
	if (!node) {
		return;
	}

	var v;
	var scope = angular.element(node).scope();

	switch (node.getAttribute('var-type')) {
		case 'int-nullable':
			v = (val !== null) ? parseInt(val) : null;
			break;
		case 'int':
			v = (val !== null) ? parseInt(val) : 0;
			break;
		case 'float':
			v = (val !== null) ? parseFloat(val) : 0;
			break;
		case 'bool':
			v = (val !== null) ? (val === 'true') : false;
		default:
			v = (val !== null) ? val : null;
			break;
	}

	scope.safeApply(function () {

		if (node.hasAttribute('model-scope-name')) {
			var arr = node.getAttribute('model-scope-name').split('.');

			if (arr.length > 0 && !scope[arr[0]]) {
				scope[arr[0]] = (arr.length == 1) ? v : {};
			}
			else if (arr.length == 1) {
				scope[arr[0]] = (arr.length == 1) ? v : {};
			}

			if (arr.length > 1 && !scope[arr[0]][arr[1]]) {
				scope[arr[0]][arr[1]] = (arr.length == 2) ? v : {};
			}
			else if (arr.length == 2) {
				scope[arr[0]][arr[1]] = (arr.length == 2) ? v : {};
			}

			if (arr.length > 2 && !scope[arr[0]][arr[1]][arr[2]]) {
				scope[arr[0]][arr[1]][arr[2]] = (arr.length == 3) ? v : {};
			}
			else if (arr.length == 3) {
				scope[arr[0]][arr[1]][arr[2]] = (arr.length == 3) ? v : {};
			}

			if (arr.length > 3 && !scope[arr[0]][arr[1]][arr[2]][arr[3]]) {
				scope[arr[0]][arr[1]][arr[2]][arr[3]] = (arr.length == 4) ? v : {};
			}
			else if (arr.length == 4) {
				scope[arr[0]][arr[1]][arr[2]][arr[3]] = (arr.length == 4) ? v : {};
			}
		}
		else {
			scope[node.id] = v;
		}

		// try {
		// 	scope.$apply();
		// }
		// catch (error) {
		// }
		// console.log('apply in progress var:' + node.id);
	});
}

function updateFields(settings = [], loadedevent = null) {
	document.getElementById('loadingtext').innerText = "Synchronizing fields...";
	document.getElementById('reloading').style.display = "block";
	for (var s in settings) {
		if (settings.hasOwnProperty(s)) {
			var node = document.querySelector("#" + s);
			if (node) {
				switch (node.type) {
					case 'range':
						updateScope(node, settings[s]);
						break;
					case 'checkbox':
						updateScope(node, (settings[s]) ? settings[s] : true);
						break;
					case 'select-one':
						updateScope(node, settings[s]);
						break;
					default:
						updateScope(node, settings[s]);
						break;
				}
			}
		}
	}

	angular.element(document.getElementById("uCNCapp")).scope().definedPins();

	document.getElementById('reloading').style.display = "none";
	if (loadedevent) {
		document.dispatchEvent(loadedevent);
	}
}

function resetBoardPins() {
	const excludeids = ['MCU', 'BOARD', 'AXIS_COUNT', 'TOOL_COUNT', 'KINEMATIC', 'ENABLE_COOLANT', 'BAUDRATE', 'S_CURVE_ACCELERATION_LEVEL'];
	document.getElementById('loadingtext').innerText = "Reseting board pins...";
	document.querySelectorAll('[config-file="boardmap"]').forEach((e, i, p) => {
		if (!excludeids.includes(e.id)) {
			updateScope(e, null);
		}
	});
}

function updateHAL(scope = null) {
	document.getElementById('loadingtext').innerText = "Fetching HAL...";
	document.getElementById('reloading').style.display = "block";
	var settings = [];
	var version_name = angular.element(document.getElementById('VERSION')).scope()['VERSIONS'].filter(obj => { return obj.tag === getScope(document.getElementById('VERSION')); })[0].id;
	var coreurl = "https://raw.githubusercontent.com/Paciente8159/uCNC/" + version_name;
	var hal = coreurl + "/uCNC/cnc_hal_config.h";

	parsePreprocessor(hal, settings, function (newsettings) {
		updateFields(newsettings, halloaded);
		if (scope) {
			scope.$apply();
		}
	});
}


function updateTool(scope = null, tool = null) {
	document.getElementById('loadingtext').innerText = "Fetching tools...";
	document.getElementById('reloading').style.display = "block";
	var settings = [];
	var version_name = angular.element(document.getElementById('VERSION')).scope()['VERSIONS'].filter(obj => { return obj.tag === getScope(document.getElementById('VERSION')); })[0].id;

	var coreurl = "https://raw.githubusercontent.com/Paciente8159/uCNC/" + version_name;
	var tool = coreurl + "/uCNC/src/hal/tools/tools/" + tool + ".c";

	if (!tool) {
		document.getElementById('reloading').style.display = "none";
		return;
	}

	parsePreprocessor(tool, settings, function (newsettings) {
		updateFields(newsettings, toolloaded);
		if (scope) {
			scope.$apply();
		}
	});
}

function updateBoardmap(scope = null) {
	var settings = [];
	var version_name = angular.element(document.getElementById('VERSION')).scope()['VERSIONS'].filter(obj => { return obj.tag === getScope(document.getElementById('VERSION')); })[0].id;

	var coreurl = "https://raw.githubusercontent.com/Paciente8159/uCNC/" + version_name;

	var mcuurl = coreurl + "/uCNC/src/hal/mcus/";

	if (!scope) {
		document.getElementById('reloading').style.display = "none";
		return;
	}

	if (scope.MCU === scope.PREV_MCU && scope.BOARD === scope.PREV_BOARD) {
		document.getElementById('reloading').style.display = "none";
		return;
	}

	scope.PREV_MCU = scope.MCU;
	scope.PREV_BOARD = scope.BOARD;

	resetBoardPins();

	switch (scope.MCU) {
		case 'MCU_AVR':
			mcuurl = mcuurl + "avr/mcumap_avr.h";
			break;
		case 'MCU_STM32F1X':
			mcuurl = mcuurl + "stm32f1x/mcumap_stm32f1x.h";
			break;
		case 'MCU_STM32F4X':
			mcuurl = mcuurl + "stm32f4x/mcumap_stm32f4x.h";
			break;
		case 'MCU_SAMD21':
			mcuurl = mcuurl + "samd21/mcumap_samd21.h";
			break;
		case 'MCU_LPC176X':
			mcuurl = mcuurl + "lpc176x/mcumap_lpc176x.h";
			break;
		case 'MCU_ESP8266':
			mcuurl = mcuurl + "esp8266/mcumap_esp8266.h";
			break;
		case 'MCU_ESP32':
			mcuurl = mcuurl + "esp32/mcumap_esp32.h";
			break;
		case 'MCU_RP2040':
			mcuurl = mcuurl + "rp2040/mcumap_rp2040.h";
			break;
		default:
			document.getElementById('reloading').style.display = "none";
			return;
	}

	parsePreprocessor(mcuurl, settings, function (newsettings) {
		document.getElementById('loadingtext').innerText = "Fetching board...";
		document.getElementById('reloading').style.display = "block";
		settings = newsettings;
		var boardurl = coreurl + "/uCNC/src/hal/boards/";
		switch (scope.BOARD) {
			case 'BOARD_UNO':
				boardurl = boardurl + "avr/boardmap_uno.h";
				break;
			case 'BOARD_MKS_DLC':
				parsePreprocessor(boardurl + "avr/boardmap_uno.h", settings, function (newsettings) {
					settings = newsettings;
					parsePreprocessor(boardurl + "avr/boardmap_mks_dlc.h", settings, function (newsettings) {
						updateFields(newsettings, boardloaded);
						if (scope) {
							scope.$apply();
						}
					});
				});
				return;
			case 'BOARD_X_CONTROLLER':
				parsePreprocessor(boardurl + "avr/boardmap_uno.h", settings, function (newsettings) {
					settings = newsettings;
					parsePreprocessor(boardurl + "avr/boardmap_x_controller.h", settings, function (newsettings) {
						updateFields(newsettings, boardloaded);
						if (scope) {
							scope.$apply();
						}
					});
				});
				return;
			case 'BOARD_UNO_SHIELD_V3':
				parsePreprocessor(boardurl + "avr/boardmap_uno.h", settings, function (newsettings) {
					settings = newsettings;
					parsePreprocessor(boardurl + "avr/boardmap_uno_shield_v3.h", settings, function (newsettings) {
						updateFields(newsettings, boardloaded);
						if (scope) {
							scope.$apply();
						}
					});
				});
				return;
			case 'BOARD_RAMBO14':
				boardurl = boardurl + "avr/boardmap_rambo14.h";
				break;
			case 'BOARD_MKS_GEN_L_V1':
				parsePreprocessor(boardurl + "avr/boardmap_ramps14.h", settings, function (newsettings) {
					settings = newsettings;
					parsePreprocessor(boardurl + "avr/boardmap_mks_gen_l_v1.h", settings, function (newsettings) {
						updateFields(newsettings, boardloaded);
						if (scope) {
							scope.$apply();
						}
					});
				});
				return;
			case 'BOARD_RAMPS14':
				boardurl = boardurl + "avr/boardmap_ramps14.h";
				break;
			case 'BOARD_BLUEPILL':
				boardurl = boardurl + "stm32/boardmap_bluepill.h";
				break;
			case 'BOARD_BLACKPILL':
				boardurl = boardurl + "stm32/boardmap_blackpill.h";
				break;
			case 'BOARD_MKS_ROBIN_NANO_V1_2':
				boardurl = boardurl + "stm32/boardmap_mks_robin_nano_v1_2.h";
				break;
			case 'BOARD_SKR_PRO_V1_2':
				boardurl = boardurl + "stm32/boardmap_srk_pro_v1_2.h";
				break;
			case 'BOARD_NUCLEO_F411RE_SHIELD_V3':
				boardurl = boardurl + "stm32/boardmap_nucleo_f411re_shield_v3.h";
				break;
			case 'BOARD_MZERO':
				boardurl = boardurl + "samd21/boardmap_mzero.h";
				break;
			case 'BOARD_ZERO':
				parsePreprocessor(boardurl + "samd21/boardmap_mzero.h", settings, function (newsettings) {
					settings = newsettings;
					parsePreprocessor(boardurl + "samd21/boardmap_zero.h", settings, function (newsettings) {
						updateFields(newsettings, boardloaded);
						if (scope) {
							scope.$apply();
						}
					});
				});
				return;
			case 'BOARD_RE_ARM':
				boardurl = boardurl + "lpc176x/boardmap_re_arm.h";
				break;
			case 'BOARD_MKS_BASE13':
				boardurl = boardurl + "lpc176x/boardmap_mks_base13.h";
				break;
			case 'BOARD_SKR_V14_TURBO':
				boardurl = boardurl + "lpc176x/boardmap_skr_v14_turbo.h";
				break;
			case 'BOARD_WEMOS_D1':
				boardurl = boardurl + "esp8266/boardmap_wemos_d1.h";
				break;
			case 'BOARD_WEMOS_D1_R32':
				boardurl = boardurl + "esp32/boardmap_wemos_d1_r32.h";
				break;
			case 'BOARD_MKS_TINYBEE':
				boardurl = boardurl + "esp32/boardmap_mks_tinybee.h";
				break;
			case 'BOARD_MKS_DLC32':
				boardurl = boardurl + "esp32/boardmap_mks_dlc32.h";
				break;
			case 'BOARD_RPI_PICO':
				boardurl = boardurl + "rp2040/boardmap_rpi_pico.h";
				break;
			case 'BOARD_RPI_PICO_W':
				parsePreprocessor(boardurl + "rp2040/boardmap_rpi_pico.h", settings, function (newsettings) {
					settings = newsettings;
					parsePreprocessor(boardurl + "rp2040/boardmap_rpi_pico_w.h", settings, function (newsettings) {
						updateFields(newsettings, boardloaded);
						if (scope) {
							scope.$apply();
						}
					});
				});
				return;
			case 'BOARD_CUSTOM':
			default:
				updateFields(newsettings, boardloaded);
				if (scope) {
					scope.$apply();
				}
				document.getElementById('reloading').style.display = "none";
				return;
		}

		parsePreprocessor(boardurl, settings, function (newsettings) {
			updateFields(newsettings, boardloaded);
			if (scope) {
				scope.$apply();
			}
		});
	});
}

var app = angular.module("uCNCapp", []);
var controller = app.controller('uCNCcontroller', ['$scope', '$rootScope', function ($scope, $rootScope) {

	$scope.JSON_BUILD = null;

	$scope.VERSIONS = [
		{ id: 'master', tag: 99999, src: 'https://github.com/Paciente8159/uCNC/archive/refs/heads/master.zip', mods: 'https://github.com/Paciente8159/uCNC-modules/archive/refs/heads/master.zip' },
		{ id: 'v1.9.4', tag: 10904, src: 'https://github.com/Paciente8159/uCNC/archive/refs/tags/v1.9.4.zip', mods: 'https://github.com/Paciente8159/uCNC-modules/archive/refs/heads/master.zip' },
		{ id: 'v1.9.3', tag: 10903, src: 'https://github.com/Paciente8159/uCNC/archive/refs/tags/v1.9.3.zip', mods: 'https://github.com/Paciente8159/uCNC-modules/archive/refs/heads/master.zip' },
		{ id: 'v1.9.2', tag: 10902, src: 'https://github.com/Paciente8159/uCNC/archive/refs/tags/v1.9.2.zip', mods: 'https://github.com/Paciente8159/uCNC-modules/archive/refs/heads/master.zip' },
		{ id: 'v1.9.1', tag: 10901, src: 'https://github.com/Paciente8159/uCNC/archive/refs/tags/v1.9.1.zip', mods: 'https://github.com/Paciente8159/uCNC-modules/archive/refs/heads/master.zip' },
		{ id: 'v1.9.0', tag: 10900, src: 'https://github.com/Paciente8159/uCNC/archive/refs/tags/v1.9.0.zip', mods: 'https://github.com/Paciente8159/uCNC-modules/archive/refs/heads/master.zip' },
		{ id: 'v1.8.x-bugfix', tag: 10879, src: 'https://github.com/Paciente8159/uCNC/archive/refs/heads/v1.8.x-bugfix.zip', mods: 'https://github.com/Paciente8159/uCNC-modules/archive/refs/heads/master.zip' },
		// { id: 'v1.8.11', tag: 10811, src: 'https://github.com/Paciente8159/uCNC/archive/refs/tags/v1.8.11.zip', mods: 'https://github.com/Paciente8159/uCNC-modules/archive/refs/heads/master.zip' },
		// { id: 'v1.8.10', tag: 10810, src: 'https://github.com/Paciente8159/uCNC/archive/refs/tags/v1.8.10.zip', mods: 'https://github.com/Paciente8159/uCNC-modules/archive/refs/heads/master.zip' },
		// { id: 'v1.8.9', tag: 10809, src: 'https://github.com/Paciente8159/uCNC/archive/refs/tags/v1.8.9.zip', mods: 'https://github.com/Paciente8159/uCNC-modules/archive/refs/heads/master.zip' },
		// { id: 'v1.8.8', tag: 10808, src: 'https://github.com/Paciente8159/uCNC/archive/refs/tags/v1.8.8.zip', mods: 'https://github.com/Paciente8159/uCNC-modules/archive/refs/heads/master.zip' },
		// { id: 'v1.8.7', tag: 10807, src: 'https://github.com/Paciente8159/uCNC/archive/refs/tags/v1.8.7.zip', mods: 'https://github.com/Paciente8159/uCNC-modules/archive/refs/heads/master.zip' },
		// { id: 'v1.8.6', tag: 10806, src: 'https://github.com/Paciente8159/uCNC/archive/refs/tags/v1.8.6.zip', mods: 'https://github.com/Paciente8159/uCNC-modules/archive/refs/heads/master.zip' },
		// { id: 'v1.8.5', tag: 10805, src: 'https://github.com/Paciente8159/uCNC/archive/refs/tags/v1.8.5.zip', mods: 'https://github.com/Paciente8159/uCNC-modules/archive/refs/heads/master.zip' },
		// { id: 'v1.8.4', tag: 10804, src: 'https://github.com/Paciente8159/uCNC/archive/refs/tags/v1.8.4.zip', mods: 'https://github.com/Paciente8159/uCNC-modules/archive/refs/heads/master.zip' },
		// { id: 'v1.8.3', tag: 10803, src: 'https://github.com/Paciente8159/uCNC/archive/refs/tags/v1.8.3.zip', mods: 'https://github.com/Paciente8159/uCNC-modules/archive/refs/heads/master.zip' },
		// { id: 'v1.8.2', tag: 10802, src: 'https://github.com/Paciente8159/uCNC/archive/refs/tags/v1.8.2.zip', mods: 'https://github.com/Paciente8159/uCNC-modules/archive/refs/heads/master.zip' },
		// { id: 'v1.8.1', tag: 10801, src: 'https://github.com/Paciente8159/uCNC/archive/refs/tags/v1.8.1.zip', mods: 'https://github.com/Paciente8159/uCNC-modules/archive/refs/heads/master.zip' },
		// { id: 'v1.8.0', tag: 10800, src: 'https://github.com/Paciente8159/uCNC/archive/refs/tags/v1.8.0.zip', mods: 'https://github.com/Paciente8159/uCNC-modules/archive/refs/heads/master.zip' },
		{ id: 'v1.7.x-bugfix', tag: 10779, src: 'https://github.com/Paciente8159/uCNC/archive/refs/heads/v1.7.x-bugfix.zip', mods: 'https://github.com/Paciente8159/uCNC-modules/archive/refs/heads/v1.7.x.zip' },
		/*{ id: 'v1.7.6', tag: 10706, src: 'https://github.com/Paciente8159/uCNC/archive/refs/tags/v1.7.6.zip', mods: 'https://github.com/Paciente8159/uCNC-modules/archive/refs/heads/v1.7.x.zip' },
		{ id: 'v1.7.5', tag: 10705, src: 'https://github.com/Paciente8159/uCNC/archive/refs/tags/v1.7.5.zip', mods: 'https://github.com/Paciente8159/uCNC-modules/archive/refs/heads/v1.7.x.zip' },
		{ id: 'v1.7.4', tag: 10704, src: 'https://github.com/Paciente8159/uCNC/archive/refs/tags/v1.7.4.zip', mods: 'https://github.com/Paciente8159/uCNC-modules/archive/refs/heads/v1.7.x.zip' },
		{ id: 'v1.7.3', tag: 10703, src: 'https://github.com/Paciente8159/uCNC/archive/refs/tags/v1.7.3.zip', mods: 'https://github.com/Paciente8159/uCNC-modules/archive/refs/heads/v1.7.x.zip' },
		{ id: 'v1.7.2', tag: 10702, src: 'https://github.com/Paciente8159/uCNC/archive/refs/tags/v1.7.2.zip', mods: 'https://github.com/Paciente8159/uCNC-modules/archive/refs/heads/v1.7.x.zip' },
		{ id: 'v1.7.1', tag: 10701, src: 'https://github.com/Paciente8159/uCNC/archive/refs/tags/v1.7.1.zip', mods: 'https://github.com/Paciente8159/uCNC-modules/archive/refs/heads/v1.7.x.zip' },
		{ id: 'v1.7.0', tag: 10700, src: 'https://github.com/Paciente8159/uCNC/archive/refs/tags/v1.7.0.zip', mods: 'https://github.com/Paciente8159/uCNC-modules/archive/refs/heads/v1.7.x.zip' },
		{ id: 'v1.7.0-beta', tag: 10680, src: 'https://github.com/Paciente8159/uCNC/archive/refs/tags/v1.7.0-beta.zip', mods: 'https://github.com/Paciente8159/uCNC-modules/archive/refs/heads/v1.7.x.zip' },
		{ id: 'v1.6.2', tag: 10602, src: 'https://github.com/Paciente8159/uCNC/archive/refs/tags/v1.6.2.zip', mods: 'https://github.com/Paciente8159/uCNC-modules/archive/refs/tags/v1.5.0.zip' },
		{ id: 'v1.6.1', tag: 10601, src: 'https://github.com/Paciente8159/uCNC/archive/refs/tags/v1.6.1.zip', mods: 'https://github.com/Paciente8159/uCNC-modules/archive/refs/tags/v1.5.0.zip' },
		{ id: 'v1.6.0', tag: 10600, src: 'https://github.com/Paciente8159/uCNC/archive/refs/tags/v1.6.0.zip', mods: 'https://github.com/Paciente8159/uCNC-modules/archive/refs/tags/v1.5.0.zip' },*/
	]

	$scope.BAUDRATES = [
		9600,
		19200,
		38400,
		57600,
		115200,
		230400,
		250000,
		576000
	]

	$scope.MCUS = [
		{ id: 'MCU_AVR', name: 'Atmel AVR' },
		{ id: 'MCU_SAMD21', name: 'Atmel SAMD21' },
		{ id: 'MCU_STM32F1X', name: 'STM32F1x' },
		{ id: 'MCU_STM32F4X', name: 'STM32F4X' },
		{ id: 'MCU_LPC176X', name: 'LPC176X' },
		{ id: 'MCU_ESP8266', name: 'ESP8266' },
		{ id: 'MCU_ESP32', name: 'ESP32' },
		{ id: 'MCU_RP2040', name: 'RPi RP2040' }
	];
	$scope.KINEMATICS = [
		{ id: 'KINEMATIC_CARTESIAN', name: 'Cartesian', version: 0 },
		{ id: 'KINEMATIC_COREXY', name: 'Core XY', version: 0 },
		{ id: 'KINEMATIC_LINEAR_DELTA', name: 'Linear delta', version: 0 },
		{ id: 'KINEMATIC_DELTA', name: 'Delta robot', version: 0 },
		{ id: 'KINEMATIC_SCARA', name: 'Scara', version: 10799 }
	];

	$scope.ACCELERATIONS = [
		{ id: -1, name: 'Selectable via $14' },
		{ id: 0, name: 'Disabled (linear)' },
		{ id: 1, name: 'Soft' },
		{ id: 2, name: 'Mild' },
		{ id: 3, name: 'Hard' },
		{ id: 4, name: 'Aggressive' },
		{ id: 5, name: 'Aggressive2' }
	];

	$scope.S_CURVE_ACCELERATION_LEVEL = 0;

	$scope.BOARDS = [
		{ id: 'BOARD_UNO', name: 'Arduino UNO', mcu: 'MCU_AVR' },
		{ id: 'BOARD_RAMBO14', name: 'Rambo v1.4', mcu: 'MCU_AVR' },
		{ id: 'BOARD_RAMPS14', name: 'Arduino MEGA/RAMPS v1.4', mcu: 'MCU_AVR' },
		{ id: 'BOARD_MKS_DLC', name: 'MKS DLC', mcu: 'MCU_AVR' },
		{ id: 'BOARD_X_CONTROLLER', name: 'X-Controller', mcu: 'MCU_AVR' },
		{ id: 'BOARD_UNO_SHIELD_V3', name: 'Arduino UNO Shield v3', mcu: 'MCU_AVR' },
		{ id: 'BOARD_MKS_GEN_L_V1', name: 'MKS Gen L v1', mcu: 'MCU_AVR' },
		{ id: 'BOARD_BLUEPILL', name: 'Bluepill STM32F103', mcu: 'MCU_STM32F1X' },
		{ id: 'BOARD_BLACKPILL', name: 'Blackpill STM32F401', mcu: 'MCU_STM32F4X' },
		{ id: 'BOARD_MKS_ROBIN_NANO_V1_2', name: 'MKS Robin Nano v1.2', mcu: 'MCU_STM32F1X' },
		{ id: 'BOARD_SKR_PRO_V1_2', name: 'SKR Pro v1.2', mcu: 'MCU_STM32F4X' },
		{ id: 'BOARD_NUCLEO_F411RE_SHIELD_V3', name: 'STM32 Nucleo F411RE', mcu: 'MCU_STM32F4X' },
		{ id: 'BOARD_MZERO', name: 'Arduino M0', mcu: 'MCU_SAMD21' },
		{ id: 'BOARD_ZERO', name: 'Arduino Zero', mcu: 'MCU_SAMD21' },
		{ id: 'BOARD_RE_ARM', name: 'Panukatt RE-ARM', mcu: 'MCU_LPC176X' },
		{ id: 'BOARD_MKS_BASE13', name: 'MKS Base v1.3', mcu: 'MCU_LPC176X' },
		{ id: 'BOARD_SKR_V14_TURBO', name: 'SKR v1.4 Turbo', mcu: 'MCU_LPC176X' },
		{ id: 'BOARD_WEMOS_D1', name: 'Wemos D1', mcu: 'MCU_ESP8266' },
		{ id: 'BOARD_WEMOS_D1_R32', name: 'Wemos D1 R32', mcu: 'MCU_ESP32' },
		{ id: 'BOARD_MKS_TINYBEE', name: 'MKS Tinybee', mcu: 'MCU_ESP32' },
		{ id: 'BOARD_MKS_DLC32', name: 'MKS DLC32', mcu: 'MCU_ESP32' },
		{ id: 'BOARD_RPI_PICO', name: 'RPi Pico', mcu: 'MCU_RP2040' },
		{ id: 'BOARD_RPI_PICO_W', name: 'RPi Pico W', mcu: 'MCU_RP2040' },
		{ id: 'BOARD_CUSTOM', name: 'Custom board', mcu: 'MCU_AVR,MCU_SAMD21,MCU_STM32F1X,MCU_STM32F4X,MCU_LPC176X,MCU_ESP8266,MCU_ESP32,MCU_RP2040' }
	];

	$scope.UCNCPINS = [
		{ pin: 'STEP0', type: 'stepper,special_output' },
		{ pin: 'STEP1', type: 'stepper,special_output' },
		{ pin: 'STEP2', type: 'stepper,special_output' },
		{ pin: 'STEP3', type: 'stepper,special_output' },
		{ pin: 'STEP4', type: 'stepper,special_output' },
		{ pin: 'STEP5', type: 'stepper,special_output' },
		{ pin: 'STEP6', type: 'stepper,special_output' },
		{ pin: 'STEP7', type: 'stepper,special_output' },
		{ pin: 'DIR0', type: 'stepper,special_output' },
		{ pin: 'DIR1', type: 'stepper,special_output' },
		{ pin: 'DIR2', type: 'stepper,special_output' },
		{ pin: 'DIR3', type: 'stepper,special_output' },
		{ pin: 'DIR4', type: 'stepper,special_output' },
		{ pin: 'DIR5', type: 'stepper,special_output' },
		{ pin: 'DIR6', type: 'stepper,special_output' },
		{ pin: 'DIR7', type: 'stepper,special_output' },
		{ pin: 'STEP0_EN', type: 'stepper,special_output' },
		{ pin: 'STEP1_EN', type: 'stepper,special_output' },
		{ pin: 'STEP2_EN', type: 'stepper,special_output' },
		{ pin: 'STEP3_EN', type: 'stepper,special_output' },
		{ pin: 'STEP4_EN', type: 'stepper,special_output' },
		{ pin: 'STEP5_EN', type: 'stepper,special_output' },
		{ pin: 'STEP6_EN', type: 'stepper,special_output' },
		{ pin: 'STEP7_EN', type: 'stepper,special_output' },
		{ pin: 'PWM0', type: 'pwm' },
		{ pin: 'PWM1', type: 'pwm' },
		{ pin: 'PWM2', type: 'pwm' },
		{ pin: 'PWM3', type: 'pwm' },
		{ pin: 'PWM4', type: 'pwm' },
		{ pin: 'PWM5', type: 'pwm' },
		{ pin: 'PWM6', type: 'pwm' },
		{ pin: 'PWM7', type: 'pwm' },
		{ pin: 'PWM8', type: 'pwm' },
		{ pin: 'PWM9', type: 'pwm' },
		{ pin: 'PWM10', type: 'pwm' },
		{ pin: 'PWM11', type: 'pwm' },
		{ pin: 'PWM12', type: 'pwm' },
		{ pin: 'PWM13', type: 'pwm' },
		{ pin: 'PWM14', type: 'pwm' },
		{ pin: 'PWM15', type: 'pwm' },
		{ pin: 'SERVO0', type: 'servo' },
		{ pin: 'SERVO1', type: 'servo' },
		{ pin: 'SERVO2', type: 'servo' },
		{ pin: 'SERVO3', type: 'servo' },
		{ pin: 'SERVO4', type: 'servo' },
		{ pin: 'SERVO5', type: 'servo' },
		{ pin: 'DOUT0', type: 'dout,generic_output' },
		{ pin: 'DOUT1', type: 'dout,generic_output' },
		{ pin: 'DOUT2', type: 'dout,generic_output' },
		{ pin: 'DOUT3', type: 'dout,generic_output' },
		{ pin: 'DOUT4', type: 'dout,generic_output' },
		{ pin: 'DOUT5', type: 'dout,generic_output' },
		{ pin: 'DOUT6', type: 'dout,generic_output' },
		{ pin: 'DOUT7', type: 'dout,generic_output' },
		{ pin: 'DOUT8', type: 'dout,generic_output' },
		{ pin: 'DOUT9', type: 'dout,generic_output' },
		{ pin: 'DOUT10', type: 'dout,generic_output' },
		{ pin: 'DOUT11', type: 'dout,generic_output' },
		{ pin: 'DOUT12', type: 'dout,generic_output' },
		{ pin: 'DOUT13', type: 'dout,generic_output' },
		{ pin: 'DOUT14', type: 'dout,generic_output' },
		{ pin: 'DOUT15', type: 'dout,generic_output' },
		{ pin: 'DOUT16', type: 'dout,generic_output' },
		{ pin: 'DOUT17', type: 'dout,generic_output' },
		{ pin: 'DOUT18', type: 'dout,generic_output' },
		{ pin: 'DOUT19', type: 'dout,generic_output' },
		{ pin: 'DOUT20', type: 'dout,generic_output' },
		{ pin: 'DOUT21', type: 'dout,generic_output' },
		{ pin: 'DOUT22', type: 'dout,generic_output' },
		{ pin: 'DOUT23', type: 'dout,generic_output' },
		{ pin: 'DOUT24', type: 'dout,generic_output' },
		{ pin: 'DOUT25', type: 'dout,generic_output' },
		{ pin: 'DOUT26', type: 'dout,generic_output' },
		{ pin: 'DOUT27', type: 'dout,generic_output' },
		{ pin: 'DOUT28', type: 'dout,generic_output' },
		{ pin: 'DOUT29', type: 'dout,generic_output' },
		{ pin: 'DOUT30', type: 'dout,generic_output' },
		{ pin: 'DOUT31', type: 'dout,generic_output' },
		{ pin: 'LIMIT_X', type: 'limit,interruptable_input,pullup' },
		{ pin: 'LIMIT_Y', type: 'limit,interruptable_input,pullup' },
		{ pin: 'LIMIT_Z', type: 'limit,interruptable_input,pullup' },
		{ pin: 'LIMIT_X2', type: 'limit,interruptable_input,pullup' },
		{ pin: 'LIMIT_Y2', type: 'limit,interruptable_input,pullup' },
		{ pin: 'LIMIT_Z2', type: 'limit,interruptable_input,pullup' },
		{ pin: 'LIMIT_A', type: 'limit,interruptable_input,pullup' },
		{ pin: 'LIMIT_B', type: 'limit,interruptable_input,pullup' },
		{ pin: 'LIMIT_C', type: 'limit,interruptable_input,pullup' },
		{ pin: 'PROBE', type: 'probe,interruptable_input,pullup' },
		{ pin: 'ESTOP', type: 'control,interruptable_input,pullup' },
		{ pin: 'SAFETY_DOOR', type: 'control,interruptable_input,pullup' },
		{ pin: 'FHOLD', type: 'control,interruptable_input,pullup' },
		{ pin: 'CS_RES', type: 'control,interruptable_input,pullup' },
		{ pin: 'ANALOG0', type: 'analog' },
		{ pin: 'ANALOG1', type: 'analog' },
		{ pin: 'ANALOG2', type: 'analog' },
		{ pin: 'ANALOG3', type: 'analog' },
		{ pin: 'ANALOG4', type: 'analog' },
		{ pin: 'ANALOG5', type: 'analog' },
		{ pin: 'ANALOG6', type: 'analog' },
		{ pin: 'ANALOG7', type: 'analog' },
		{ pin: 'ANALOG8', type: 'analog' },
		{ pin: 'ANALOG9', type: 'analog' },
		{ pin: 'ANALOG10', type: 'analog' },
		{ pin: 'ANALOG11', type: 'analog' },
		{ pin: 'ANALOG12', type: 'analog' },
		{ pin: 'ANALOG13', type: 'analog' },
		{ pin: 'ANALOG14', type: 'analog' },
		{ pin: 'ANALOG15', type: 'analog' },
		{ pin: 'DIN0', type: 'din,interruptable_generic_input,interruptable_input,generic_input,pullup' },
		{ pin: 'DIN1', type: 'din,interruptable_generic_input,interruptable_input,generic_input,pullup' },
		{ pin: 'DIN2', type: 'din,interruptable_generic_input,interruptable_input,generic_input,pullup' },
		{ pin: 'DIN3', type: 'din,interruptable_generic_input,interruptable_input,generic_input,pullup' },
		{ pin: 'DIN4', type: 'din,interruptable_generic_input,interruptable_input,generic_input,pullup' },
		{ pin: 'DIN5', type: 'din,interruptable_generic_input,interruptable_input,generic_input,pullup' },
		{ pin: 'DIN6', type: 'din,interruptable_generic_input,interruptable_input,generic_input,pullup' },
		{ pin: 'DIN7', type: 'din,interruptable_generic_input,interruptable_input,generic_input,pullup' },
		{ pin: 'DIN8', type: 'din,generic_input,pullup' },
		{ pin: 'DIN9', type: 'din,generic_input,pullup' },
		{ pin: 'DIN10', type: 'din,generic_input,pullup' },
		{ pin: 'DIN11', type: 'din,generic_input,pullup' },
		{ pin: 'DIN12', type: 'din,generic_input,pullup' },
		{ pin: 'DIN13', type: 'din,generic_input,pullup' },
		{ pin: 'DIN14', type: 'din,generic_input,pullup' },
		{ pin: 'DIN15', type: 'din,generic_input,pullup' },
		{ pin: 'DIN16', type: 'din,generic_input,pullup' },
		{ pin: 'DIN17', type: 'din,generic_input,pullup' },
		{ pin: 'DIN18', type: 'din,generic_input,pullup' },
		{ pin: 'DIN19', type: 'din,generic_input,pullup' },
		{ pin: 'DIN20', type: 'din,generic_input,pullup' },
		{ pin: 'DIN21', type: 'din,generic_input,pullup' },
		{ pin: 'DIN22', type: 'din,generic_input,pullup' },
		{ pin: 'DIN23', type: 'din,generic_input,pullup' },
		{ pin: 'DIN24', type: 'din,generic_input,pullup' },
		{ pin: 'DIN25', type: 'din,generic_input,pullup' },
		{ pin: 'DIN26', type: 'din,generic_input,pullup' },
		{ pin: 'DIN27', type: 'din,generic_input,pullup' },
		{ pin: 'DIN28', type: 'din,generic_input,pullup' },
		{ pin: 'DIN29', type: 'din,generic_input,pullup' },
		{ pin: 'DIN30', type: 'din,generic_input,pullup' },
		{ pin: 'DIN31', type: 'din,generic_input,pullup' },
		{ pin: 'TX', type: 'communications,special_output' },
		{ pin: 'RX', type: 'communications,special input' },
		{ pin: 'USB_DM', type: 'communications,special_output' },
		{ pin: 'USB_DP', type: 'communications,special_output' },
		{ pin: 'SPI_CLK', type: 'communications,special_output' },
		{ pin: 'SPI_SDI', type: 'communications,special input' },
		{ pin: 'SPI_SDO', type: 'communications,special_output' },
		{ pin: 'SPI_CS', type: 'communications,special_output,generic_output' },
		{ pin: 'I2C_CLK', type: 'communications,special input' },
		{ pin: 'I2C_DATA', type: 'communications,special input' },
		{ pin: 'TX2', type: 'communications,special input' },
		{ pin: 'RX2', type: 'communications,special input' }
	];

	$scope.PINS = [
		{ pin: 0, mcu: 'MCU_AVR,MCU_SAMD21,MCU_STM32F1X,MCU_STM32F4X,MCU_LPC176X,MCU_ESP8266,MCU_ESP32,MCU_RP2040' },
		{ pin: 1, mcu: 'MCU_AVR,MCU_SAMD21,MCU_STM32F1X,MCU_STM32F4X,MCU_LPC176X,MCU_ESP8266,MCU_ESP32,MCU_RP2040' },
		{ pin: 2, mcu: 'MCU_AVR,MCU_SAMD21,MCU_STM32F1X,MCU_STM32F4X,MCU_LPC176X,MCU_ESP8266,MCU_ESP32,MCU_RP2040' },
		{ pin: 3, mcu: 'MCU_AVR,MCU_SAMD21,MCU_STM32F1X,MCU_STM32F4X,MCU_LPC176X,MCU_ESP8266,MCU_ESP32,MCU_RP2040' },
		{ pin: 4, mcu: 'MCU_AVR,MCU_SAMD21,MCU_STM32F1X,MCU_STM32F4X,MCU_LPC176X,MCU_ESP8266,MCU_ESP32,MCU_RP2040' },
		{ pin: 5, mcu: 'MCU_AVR,MCU_SAMD21,MCU_STM32F1X,MCU_STM32F4X,MCU_LPC176X,MCU_ESP8266,MCU_ESP32,MCU_RP2040' },
		{ pin: 6, mcu: 'MCU_AVR,MCU_SAMD21,MCU_STM32F1X,MCU_STM32F4X,MCU_LPC176X,MCU_ESP8266,MCU_ESP32,MCU_RP2040' },
		{ pin: 7, mcu: 'MCU_AVR,MCU_SAMD21,MCU_STM32F1X,MCU_STM32F4X,MCU_LPC176X,MCU_ESP8266,MCU_ESP32,MCU_RP2040' },
		{ pin: 8, mcu: 'MCU_SAMD21,MCU_STM32F1X,MCU_STM32F4X,MCU_LPC176X,MCU_ESP8266,MCU_ESP32,MCU_RP2040' },
		{ pin: 9, mcu: 'MCU_SAMD21,MCU_STM32F1X,MCU_STM32F4X,MCU_LPC176X,MCU_ESP8266,MCU_ESP32,MCU_RP2040' },
		{ pin: 10, mcu: 'MCU_SAMD21,MCU_STM32F1X,MCU_STM32F4X,MCU_LPC176X,MCU_ESP8266,MCU_ESP32,MCU_RP2040' },
		{ pin: 11, mcu: 'MCU_SAMD21,MCU_STM32F1X,MCU_STM32F4X,MCU_LPC176X,MCU_ESP8266,MCU_ESP32,MCU_RP2040' },
		{ pin: 12, mcu: 'MCU_SAMD21,MCU_STM32F1X,MCU_STM32F4X,MCU_LPC176X,MCU_ESP8266,MCU_ESP32,MCU_RP2040' },
		{ pin: 13, mcu: 'MCU_SAMD21,MCU_STM32F1X,MCU_STM32F4X,MCU_LPC176X,MCU_ESP8266,MCU_ESP32,MCU_RP2040' },
		{ pin: 14, mcu: 'MCU_SAMD21,MCU_STM32F1X,MCU_STM32F4X,MCU_LPC176X,MCU_ESP8266,MCU_ESP32,MCU_RP2040' },
		{ pin: 15, mcu: 'MCU_SAMD21,MCU_STM32F1X,MCU_STM32F4X,MCU_LPC176X,MCU_ESP8266,MCU_ESP32,MCU_RP2040' },
		{ pin: 16, mcu: 'MCU_SAMD21,MCU_LPC176X,MCU_ESP8266,MCU_ESP32,MCU_RP2040' },
		{ pin: 17, mcu: 'MCU_SAMD21,MCU_LPC176X,MCU_ESP8266,MCU_ESP32,MCU_RP2040' },
		{ pin: 18, mcu: 'MCU_SAMD21,MCU_LPC176X,MCU_ESP8266,MCU_ESP32,MCU_RP2040' },
		{ pin: 19, mcu: 'MCU_SAMD21,MCU_LPC176X,MCU_ESP8266,MCU_ESP32,MCU_RP2040' },
		{ pin: 20, mcu: 'MCU_SAMD21,MCU_LPC176X,MCU_ESP8266,MCU_ESP32,MCU_RP2040' },
		{ pin: 21, mcu: 'MCU_SAMD21,MCU_LPC176X,MCU_ESP8266,MCU_ESP32,MCU_RP2040' },
		{ pin: 22, mcu: 'MCU_SAMD21,MCU_LPC176X,MCU_ESP8266,MCU_ESP32,MCU_RP2040' },
		{ pin: 23, mcu: 'MCU_SAMD21,MCU_LPC176X,MCU_ESP8266,MCU_ESP32,MCU_RP2040' },
		{ pin: 24, mcu: 'MCU_SAMD21,MCU_LPC176X,MCU_ESP8266,MCU_ESP32,MCU_RP2040' },
		{ pin: 25, mcu: 'MCU_SAMD21,MCU_LPC176X,MCU_ESP8266,MCU_ESP32,MCU_RP2040' },
		{ pin: 26, mcu: 'MCU_SAMD21,MCU_LPC176X,MCU_ESP8266,MCU_ESP32,MCU_RP2040' },
		{ pin: 27, mcu: 'MCU_SAMD21,MCU_LPC176X,MCU_ESP8266,MCU_ESP32,MCU_RP2040' },
		{ pin: 28, mcu: 'MCU_SAMD21,MCU_LPC176X,MCU_ESP8266,MCU_ESP32,MCU_RP2040' },
		{ pin: 29, mcu: 'MCU_SAMD21,MCU_LPC176X,MCU_ESP8266,MCU_ESP32' },
		{ pin: 30, mcu: 'MCU_SAMD21,MCU_LPC176X,MCU_ESP8266,MCU_ESP32' },
		{ pin: 31, mcu: 'MCU_SAMD21,MCU_LPC176X,MCU_ESP8266,MCU_ESP32' },
		{ pin: 32, mcu: 'MCU_ESP32' },
		{ pin: 33, mcu: 'MCU_ESP32' },
		{ pin: 34, mcu: 'MCU_ESP32' },
		{ pin: 35, mcu: 'MCU_ESP32' },
		{ pin: 36, mcu: 'MCU_ESP32' },
		{ pin: 37, mcu: 'MCU_ESP32' },
		{ pin: 38, mcu: 'MCU_ESP32' },
		{ pin: 39, mcu: 'MCU_ESP32' }
	];

	$scope.PORTS = [
		{ port: 'A', mcu: 'MCU_AVR,MCU_SAMD21,MCU_STM32F1X,MCU_STM32F4X' },
		{ port: 'B', mcu: 'MCU_AVR,MCU_SAMD21,MCU_STM32F1X,MCU_STM32F4X' },
		{ port: 'C', mcu: 'MCU_AVR,MCU_SAMD21,MCU_STM32F1X,MCU_STM32F4X' },
		{ port: 'D', mcu: 'MCU_AVR,MCU_SAMD21,MCU_STM32F1X,MCU_STM32F4X' },
		{ port: 'E', mcu: 'MCU_AVR,MCU_SAMD21,MCU_STM32F1X,MCU_STM32F4X' },
		{ port: 'F', mcu: 'MCU_AVR,MCU_SAMD21,MCU_STM32F1X,MCU_STM32F4X' },
		{ port: 'G', mcu: 'MCU_AVR,MCU_SAMD21,MCU_STM32F1X,MCU_STM32F4X' },
		{ port: 'H', mcu: 'MCU_AVR,MCU_SAMD21,MCU_STM32F1X,MCU_STM32F4X' },
		{ port: 'I', mcu: 'MCU_AVR,MCU_SAMD21,MCU_STM32F1X,MCU_STM32F4X' },
		{ port: 'J', mcu: 'MCU_AVR,MCU_SAMD21,MCU_STM32F1X,MCU_STM32F4X' },
		{ port: 'K', mcu: 'MCU_AVR,MCU_SAMD21,MCU_STM32F1X,MCU_STM32F4X' },
		{ port: 'L', mcu: 'MCU_AVR,MCU_SAMD21,MCU_STM32F1X,MCU_STM32F4X' },
		{ port: 'M', mcu: 'MCU_AVR,MCU_SAMD21,MCU_STM32F1X,MCU_STM32F4X' },
		{ port: 'N', mcu: 'MCU_AVR,MCU_SAMD21,MCU_STM32F1X,MCU_STM32F4X' },
		{ port: '0', mcu: 'MCU_LPC176X' },
		{ port: '1', mcu: 'MCU_LPC176X' },
		{ port: '2', mcu: 'MCU_LPC176X' },
		{ port: '3', mcu: 'MCU_LPC176X' },
		{ port: '4', mcu: 'MCU_LPC176X' }
	];

	$scope.ISRS = [
		{ isr: 0, mcu: 'MCU_AVR' },
		{ isr: 1, mcu: 'MCU_AVR' },
		{ isr: 2, mcu: 'MCU_AVR' },
		{ isr: -1, mcu: 'MCU_AVR' },
		{ isr: -2, mcu: 'MCU_AVR' },
		{ isr: -3, mcu: 'MCU_AVR' },
		{ isr: -4, mcu: 'MCU_AVR' },
		{ isr: -5, mcu: 'MCU_AVR' },
		{ isr: -6, mcu: 'MCU_AVR' },
		{ isr: -7, mcu: 'MCU_AVR' },
		{ isr: -8, mcu: 'MCU_AVR' }
	];

	$scope.CHANNELS = [
		{ channel: 0, mcu: 'MCU_SAMD21,MCU_STM32F1X,MCU_STM32F4X,MCU_LPC176X,MCU_ESP32' },
		{ channel: 1, mcu: 'MCU_SAMD21,MCU_STM32F1X,MCU_STM32F4X,MCU_LPC176X,MCU_ESP32' },
		{ channel: 2, mcu: 'MCU_SAMD21,MCU_STM32F1X,MCU_STM32F4X,MCU_LPC176X,MCU_ESP32' },
		{ channel: 3, mcu: 'MCU_SAMD21,MCU_STM32F1X,MCU_STM32F4X,MCU_LPC176X,MCU_ESP32' },
		{ channel: 4, mcu: 'MCU_SAMD21,MCU_STM32F1X,MCU_STM32F4X,MCU_LPC176X' },
		{ channel: 5, mcu: 'MCU_SAMD21,MCU_STM32F1X,MCU_STM32F4X,MCU_LPC176X' },
		{ channel: 6, mcu: 'MCU_SAMD21,MCU_STM32F1X,MCU_STM32F4X,MCU_LPC176X' },
		{ channel: 7, mcu: 'MCU_SAMD21,MCU_STM32F1X,MCU_STM32F4X,MCU_LPC176X' },
		{ channel: 8, mcu: 'MCU_SAMD21,MCU_STM32F1X,MCU_STM32F4X,MCU_LPC176X' },
		{ channel: 9, mcu: 'MCU_SAMD21,MCU_STM32F1X,MCU_STM32F4X,MCU_LPC176X' },
		{ channel: 10, mcu: 'MCU_SAMD21,MCU_STM32F1X,MCU_STM32F4X,MCU_LPC176X' },
		{ channel: 11, mcu: 'MCU_SAMD21,MCU_STM32F1X,MCU_STM32F4X,MCU_LPC176X' },
		{ channel: 12, mcu: 'MCU_SAMD21,MCU_STM32F1X,MCU_STM32F4X,MCU_LPC176X' },
		{ channel: 13, mcu: 'MCU_SAMD21,MCU_STM32F1X,MCU_STM32F4X,MCU_LPC176X' },
		{ channel: 14, mcu: 'MCU_SAMD21,MCU_STM32F1X,MCU_STM32F4X,MCU_LPC176X' },
		{ channel: 15, mcu: 'MCU_SAMD21,MCU_STM32F1X,MCU_STM32F4X,MCU_LPC176X' },
		{ channel: 'A', mcu: 'MCU_AVR' },
		{ channel: 'B', mcu: 'MCU_AVR' },
		{ channel: 'C', mcu: 'MCU_AVR' },
		{ channel: 'D', mcu: 'MCU_AVR' }
	];

	$scope.TIMERS = [
		{ timer: 0, mcu: 'MCU_AVR,MCU_SAMD21,MCU_STM32F1X,MCU_STM32F4X,MCU_LPC176X,MCU_RP2040,MCU_ESP32' },
		{ timer: 1, mcu: 'MCU_AVR,MCU_SAMD21,MCU_STM32F1X,MCU_STM32F4X,MCU_LPC176X,MCU_RP2040,MCU_ESP32' },
		{ timer: 2, mcu: 'MCU_AVR,MCU_SAMD21,MCU_STM32F1X,MCU_STM32F4X,MCU_LPC176X,MCU_RP2040,MCU_ESP32' },
		{ timer: 3, mcu: 'MCU_AVR,MCU_SAMD21,MCU_STM32F1X,MCU_STM32F4X,MCU_LPC176X,MCU_RP2040,MCU_ESP32' },
		{ timer: 4, mcu: 'MCU_AVR,MCU_SAMD21,MCU_STM32F1X,MCU_STM32F4X' },
		{ timer: 5, mcu: 'MCU_AVR,MCU_SAMD21,MCU_STM32F1X,MCU_STM32F4X' },
		{ timer: 6, mcu: 'MCU_SAMD21,MCU_STM32F1X,MCU_STM32F4X' },
		{ timer: 7, mcu: 'MCU_SAMD21,MCU_STM32F1X,MCU_STM32F4X' },
		{ timer: 8, mcu: 'MCU_SAMD21,MCU_STM32F1X,MCU_STM32F4X' },
		{ timer: 9, mcu: 'MCU_SAMD21,MCU_STM32F1X,MCU_STM32F4X' },
		{ timer: 10, mcu: 'MCU_STM32F1X,MCU_STM32F4X' },
		{ timer: 11, mcu: 'MCU_STM32F1X,MCU_STM32F4X' },
		{ timer: 12, mcu: 'MCU_STM32F1X,MCU_STM32F4X' },
		{ timer: 13, mcu: 'MCU_STM32F1X,MCU_STM32F4X' },
		{ timer: 14, mcu: 'MCU_STM32F1X,MCU_STM32F4X' },
		{ timer: 15, mcu: 'MCU_STM32F1X,MCU_STM32F4X' }
	];

	$scope.UCNCTIMERS = [
		{ timer: 'ITP', mcu: 'MCU_AVR,MCU_SAMD21,MCU_STM32F1X,MCU_STM32F4X,MCU_LPC176X,MCU_ESP32,MCU_RP2040' },
		{ timer: 'RTC', mcu: 'MCU_AVR,MCU_RP2040' },
		{ timer: 'SERVO', mcu: 'MCU_AVR,MCU_SAMD21,MCU_STM32F1X,MCU_STM32F4X,MCU_LPC176X,MCU_ESP32,MCU_RP2040' },
		{ timer: 'ONESHOT', mcu: 'MCU_AVR,MCU_SAMD21,MCU_STM32F1X,MCU_STM32F4X,MCU_LPC176X,MCU_ESP32,MCU_RP2040' }
	];

	$scope.UCNCUARTS = [
		{ port: 0, mcu: 'MCU_AVR,MCU_SAMD21,MCU_LPC176X,MCU_ESP32,MCU_RP2040,MCU_ESP8266' },
		{ port: 1, mcu: 'MCU_AVR,MCU_SAMD21,MCU_STM32F1X,MCU_STM32F4X,MCU_LPC176X,MCU_ESP32,MCU_RP2040' },
		{ port: 2, mcu: 'MCU_AVR,MCU_SAMD21,MCU_STM32F1X,MCU_STM32F4X,MCU_LPC176X,MCU_ESP32,MCU_RP2040' },
		{ port: 3, mcu: 'MCU_AVR,MCU_SAMD21,MCU_STM32F1X,MCU_STM32F4X,MCU_LPC176X' },
		{ port: 4, mcu: 'MCU_SAMD21,MCU_STM32F1X,MCU_STM32F4X' },
		{ port: 5, mcu: 'MCU_SAMD21,MCU_STM32F1X,MCU_STM32F4X' }
	];

	$scope.UCNCSPI = [
		{ port: 0, mcu: 'MCU_AVR,MCU_LPC176X,MCU_ESP32,MCU_RP2040,MCU_ESP8266' },
		{ port: 1, mcu: 'MCU_SAMD21,MCU_STM32F1X,MCU_STM32F4X,MCU_LPC176X,MCU_ESP32,MCU_RP2040' },
		{ port: 2, mcu: 'MCU_STM32F1X,MCU_STM32F4X,MCU_ESP32' },
		{ port: 3, mcu: 'MCU_SAMD21,MCU_STM32F1X,MCU_STM32F4X' }
	];


	$scope.UCNCI2C = [
		{ port: 0, mcu: 'MCU_AVR,MCU_SAMD21,MCU_LPC176X,MCU_ESP32,MCU_RP2040' },
		{ port: 1, mcu: 'MCU_SAMD21,MCU_STM32F1X,MCU_STM32F4X,MCU_LPC176X,MCU_ESP32,MCU_RP2040' },
		{ port: 2, mcu: 'MCU_SAMD21,MCU_STM32F1X,MCU_STM32F4X,MCU_LPC176X,MCU_ESP32' },
		{ port: 3, mcu: 'MCU_SAMD21,MCU_STM32F1X,MCU_STM32F4X' },
		{ port: 4, mcu: 'MCU_SAMD21' },
		{ port: 5, mcu: 'MCU_SAMD21' }
	];

	$scope.IO_OFFSETS = [
		{ offset: 0, mcu: 'MCU_ESP32' },
		{ offset: 1, mcu: 'MCU_ESP32' },
		{ offset: 2, mcu: 'MCU_ESP32' },
		{ offset: 3, mcu: 'MCU_ESP32' },
		{ offset: 4, mcu: 'MCU_ESP32' },
		{ offset: 5, mcu: 'MCU_ESP32' },
		{ offset: 6, mcu: 'MCU_ESP32' },
		{ offset: 7, mcu: 'MCU_ESP32' },
		{ offset: 8, mcu: 'MCU_ESP32' },
		{ offset: 9, mcu: 'MCU_ESP32' },
		{ offset: 10, mcu: 'MCU_ESP32' },
		{ offset: 11, mcu: 'MCU_ESP32' },
		{ offset: 12, mcu: 'MCU_ESP32' },
		{ offset: 13, mcu: 'MCU_ESP32' },
		{ offset: 14, mcu: 'MCU_ESP32' },
		{ offset: 15, mcu: 'MCU_ESP32' },
		{ offset: 16, mcu: 'MCU_ESP32' },
		{ offset: 17, mcu: 'MCU_ESP32' },
		{ offset: 18, mcu: 'MCU_ESP32' },
		{ offset: 19, mcu: 'MCU_ESP32' },
		{ offset: 20, mcu: 'MCU_ESP32' },
		{ offset: 21, mcu: 'MCU_ESP32' },
		{ offset: 22, mcu: 'MCU_ESP32' },
		{ offset: 23, mcu: 'MCU_ESP32' },
		{ offset: 24, mcu: 'MCU_ESP32' },
		{ offset: 25, mcu: 'MCU_ESP32' },
		{ offset: 26, mcu: 'MCU_ESP32' },
		{ offset: 27, mcu: 'MCU_ESP32' },
		{ offset: 28, mcu: 'MCU_ESP32' },
		{ offset: 29, mcu: 'MCU_ESP32' },
		{ offset: 30, mcu: 'MCU_ESP32' },
		{ offset: 31, mcu: 'MCU_ESP32' },
		{ offset: 32, mcu: 'MCU_ESP32' },
		{ offset: 33, mcu: 'MCU_ESP32' },
		{ offset: 34, mcu: 'MCU_ESP32' },
		{ offset: 35, mcu: 'MCU_ESP32' },
		{ offset: 36, mcu: 'MCU_ESP32' },
		{ offset: 37, mcu: 'MCU_ESP32' },
		{ offset: 38, mcu: 'MCU_ESP32' },
		{ offset: 39, mcu: 'MCU_ESP32' },
		{ offset: 40, mcu: 'MCU_ESP32' },
		{ offset: 41, mcu: 'MCU_ESP32' },
		{ offset: 42, mcu: 'MCU_ESP32' },
		{ offset: 43, mcu: 'MCU_ESP32' },
		{ offset: 44, mcu: 'MCU_ESP32' },
		{ offset: 45, mcu: 'MCU_ESP32' },
		{ offset: 46, mcu: 'MCU_ESP32' },
		{ offset: 47, mcu: 'MCU_ESP32' },
		{ offset: 48, mcu: 'MCU_ESP32' },
		{ offset: 49, mcu: 'MCU_ESP32' },
		{ offset: 50, mcu: 'MCU_ESP32' },
		{ offset: 51, mcu: 'MCU_ESP32' },
		{ offset: 52, mcu: 'MCU_ESP32' },
		{ offset: 53, mcu: 'MCU_ESP32' },
		{ offset: 54, mcu: 'MCU_ESP32' },
		{ offset: 55, mcu: 'MCU_ESP32' }
	];

	$scope.MUXS = [
		{ mux: 'A', mcu: 'MCU_SAMD21' },
		{ mux: 'B', mcu: 'MCU_SAMD21' },
		{ mux: 'C', mcu: 'MCU_SAMD21' },
		{ mux: 'D', mcu: 'MCU_SAMD21' },
		{ mux: 'E', mcu: 'MCU_SAMD21' },
		{ mux: 'F', mcu: 'MCU_SAMD21' },
		{ mux: 'G', mcu: 'MCU_SAMD21' },
		{ mux: 'H', mcu: 'MCU_SAMD21' }
	];

	$scope.CONTROLS = [
		'ESTOP',
		'SAFETY_DOOR',
		'FHOLD',
		'CS_RES'
	];

	$scope.LIMITS = [
		{ limit: 'LIMIT_X', axis: '1,2,3,4,5,6' },
		{ limit: 'LIMIT_Y', axis: '2,3,4,5,6' },
		{ limit: 'LIMIT_Z', axis: '3,4,5,6' },
		{ limit: 'LIMIT_X2', axis: '1,2,3,4,5,6' },
		{ limit: 'LIMIT_Y2', axis: '2,3,4,5,6' },
		{ limit: 'LIMIT_Z2', axis: '3,4,5,6' },
		{ limit: 'LIMIT_A', axis: '4,5,6' },
		{ limit: 'LIMIT_B', axis: '5,6' },
		{ limit: 'LIMIT_C', axis: '6' },
	];

	$scope.TOOLS = [
		1,
		2,
		3,
		4,
		5,
		6,
		7,
		8,
		9,
		10,
		11,
		12,
		13,
		14,
		15,
		16
	];

	$scope.ENCODER = [
		0,
		1,
		2,
		3,
		4,
		5,
		6,
		7
	];

	$scope.STEP_ENCODERS = [
		'STEP0_ENCODER',
		'STEP1_ENCODER',
		'STEP2_ENCODER',
		'STEP3_ENCODER',
		'STEP4_ENCODER',
		'STEP5_ENCODER',
		'STEP6_ENCODER',
		'STEP7_ENCODER'
	];

	$scope.AXIS = [
		1,
		2,
		3,
		4,
		5,
		6
	];

	$scope.DYNAMIC = {};

	$scope.TOOL_OPTIONS = [
		{ id: 'spindle_pwm', name: 'Spindle PWM' },
		{ id: 'spindle_besc', name: 'BESC Spindle' },
		{ id: 'spindle_relay', name: 'Spindle Relay' },
		{ id: 'laser_pwm', name: 'Laser PWM' },
		{ id: 'laser_ppi', name: 'Laser PPI' },
		{ id: 'vfd_modbus', name: 'VFD Modbus' },
		{ id: 'vfd_pwm', name: 'VFD PWM' },
		{ id: 'pen_servo', name: 'Pen Servo' },
		{ id: 'plasma_thc', name: 'Plasma THC' }
	];

	$scope.MODULES_OPTIONS = [
		{ id: 'g5', name: 'Linux CNC G5 and G5.1 and allows to make motions based on splines via control points', },
		{ id: 'g7_g8', name: 'Linux CNC G7/G8 to set radius mode for lathes' },
		{ id: 'g33', name: 'Linux CNC G33 and allows to make motions synched with the spindle' },
		{ id: 'm17_m18', name: 'Marlin M17-M18 and allows enable/disable stepper motors' },
		{ id: 'm42', name: 'Marlin M42 and allows to turn on and off any generic digital pin, PWM or servo pin' },
		{ id: 'm62_m65', name: 'LinuxCNC M62-M65 and allows to turn on and off any generic digital pin (synched or immediately)' },
		{ id: 'm67_m68', name: 'LinuxCNC M67-M68 and allows to turn on and off any analog pin (synched or immediately)' },
		{ id: 'm80_m81', name: 'Marlin M80-M81 and allows to turn on and off a pin controling the PSU' },
		{ id: 'i2c_lcd', name: 'Support for an I2C LCD that display the current machine position and limits state' },
		{ id: 'smoothie_clustering', name: 'Smoothieware S Cluster support' },
		{ id: 'graphic_display', name: 'Support for RepRap Full Graphic Display' },
		/*{ id: 'sd_card', name: 'Support for SD/MMC card via hardware/software SPI (DEPRECATED)' },*/
		{ id: 'sd_card_pf', name: 'Support for SD/MMC card via hardware/software SPI and optional FS (requires up to v1.8.x to work)', condition: 'VERSION<010880' },
		{ id: 'sd_card_v2', name: 'Support for SD/MMC card via hardware/software SPI (v2 requires at least v1.9.0 to work)', condition: 'VERSION>010879' },
		{ id: 'bltouch', name: 'Support for BLTouch probe' },
		{ id: 'web_pendant', name: 'Adds a web pendant for WiFi capable devices. (requires at least v1.8.1 to work and up to 1.8.x)', condition: 'VERSION>010800 && VERSION<010880' },
		{ id: 'web_pendant', name: 'Adds an improved web pendant for WiFi capable devices. (requires at least v1.9.0 to work)', condition: 'VERSION>010879' },
		{ id: 'tmc_driver', name: 'Support for TMC drivers. (requires at least v1.8.7 to work)', condition: 'VERSION>010806' },
		{ id: 'tone_speaker', name: 'Plays sounds and tunes using a PWM output.' },
	];

	$scope.STEPPERS = [
		0,
		1,
		2,
		3,
		4,
		5,
		6,
		7
	];

	$scope.TMCS = [
		2202,
		2208,
		2209,
		2225,
		2226,
		2130
	];

	$scope.TMCS_COM = [
		{ id: 'TMC_UART', name: 'Software UART' },
		{ id: 'TMC_SPI', name: 'Software SPI' },
		{ id: 'TMC_ONEWIRE', name: 'Software ONEWIRE' },
		{ id: 'TMC_UART2_HW', name: 'Hardware UART2' },
		{ id: 'TMC_SPI_HW', name: 'Hardware SPI' },
	];

	$scope.LINACTS = [
		{ value: 1, name: 'LINACT0_IO_MASK', label: 'Linear actuator 0 (AXIS X) STEP IO outputs', axisnum: 0 },
		{ value: 2, name: 'LINACT1_IO_MASK', label: 'Linear actuator 1 (AXIS Y) STEP IO outputs', axisnum: 1 },
		{ value: 4, name: 'LINACT2_IO_MASK', label: 'Linear actuator 2 (AXIS Z) STEP IO outputs', axisnum: 2 },
		{ value: 8, name: 'LINACT3_IO_MASK', label: 'Linear actuator 3 (AXIS A) STEP IO outputs', axisnum: 3 },
		{ value: 16, name: 'LINACT4_IO_MASK', label: 'Linear actuator 4 (AXIS B) STEP IO outputs', axisnum: 4 },
		{ value: 32, name: 'LINACT5_IO_MASK', label: 'Linear actuator 5 (AXIS C) step IO outputs', axisnum: 5 }
	];


	$scope.LINACTS_LIMITS = [
		{ value: '1', name: 'LIMIT_X_IO_MASK', label: 'Limit X will stop which STEP IO output?', axisnum: 0, pin: 'LIMIT_X' },
		{ value: '2', name: 'LIMIT_Y_IO_MASK', label: 'Limit Y will stop which STEP IO output?', axisnum: 1, pin: 'LIMIT_Y' },
		{ value: '4', name: 'LIMIT_Z_IO_MASK', label: 'Limit Z will stop which STEP IO output?', axisnum: 2, pin: 'LIMIT_Z' },
		{ value: '8', name: 'LIMIT_A_IO_MASK', label: 'Limit A will stop which STEP IO output?', axisnum: 3, pin: 'LIMIT_A' },
		{ value: '16', name: 'LIMIT_B_IO_MASK', label: 'Limit B will stop which STEP IO output?', axisnum: 4, pin: 'LIMIT_B' },
		{ value: '32', name: 'LIMIT_C_IO_MASK', label: 'Limit C will stop which STEP IO output?', axisnum: 5, pin: 'LIMIT_C' },
		{ value: '1', name: 'LIMIT_X2_IO_MASK', label: 'Limit X2 will stop which STEP IO output?', axisnum: 3, pin: 'LIMIT_X2' },
		{ value: '2', name: 'LIMIT_Y2_IO_MASK', label: 'Limit Y2 will stop which STEP IO output?', axisnum: 4, pin: 'LIMIT_Y2' },
		{ value: '4', name: 'LIMIT_Z2_IO_MASK', label: 'Limit Z2 will stop which STEP IO output?', axisnum: 5, pin: 'LIMIT_Z2' }
	];

	$scope.STEP_IOS = [
		{ value: 1, name: 'STEP0', selected: false },
		{ value: 2, name: 'STEP1', selected: false },
		{ value: 4, name: 'STEP2', selected: false },
		{ value: 8, name: 'STEP3', selected: false },
		{ value: 16, name: 'STEP4', selected: false },
		{ value: 32, name: 'STEP5', selected: false },
		{ value: 64, name: 'STEP6', selected: false },
		{ value: 128, name: 'STEP7', selected: false }
	];

	$scope.MICROSTEPS = [
		1,
		2,
		4,
		8,
		16,
		32
	];

	$scope.PREV_MCU = "";
	$scope.MCU = "MCU_AVR";
	$scope.PREV_BOARD = "";
	$scope.BOARD = "BOARD_UNO";
	$scope.KINEMATIC = "KINEMATIC_CARTESIAN";
	$scope.AXIS_COUNT = 3;
	$scope.TOOL_COUNT = 1;
	$scope.BAUDRATE = 115200;
	$scope.ENABLE_COOLANT = false;
	$scope.DEFINED_PINS = [];
	$scope.PREBUILD_CONFIGS = null;

	$scope.safeApply = function (fn) {
		var phase = this.$root.$$phase;
		if (phase == '$apply' || phase == '$digest') {
			if (fn && (typeof (fn) === 'function')) {
				fn();
			}
		} else {
			this.$apply(fn);
		}
	};

	$scope.getVersion = function (ver) {
		return $scope['VERSIONS'].filter(obj => { return obj.tag === ver; })[0].id;
	}

	$scope.getSrc = function (ver) {
		return $scope['VERSIONS'].filter(obj => { return obj.tag === ver; })[0].src;
	}

	$scope.getModules = function (ver) {
		return $scope['VERSIONS'].filter(obj => { return obj.tag === ver; })[0].mods;
	}

	$scope.numSmallerOrEq = function (arr, ref) {
		var refval = $scope[ref];
		if (!refval) {
			return [];
		}
		const res = arr.filter(val => val <= parseInt(refval));
		return res;
	}

	$scope.numSmaller = function (arr, ref) {
		var refval = $scope[ref];
		if (!refval) {
			return [];
		}
		const res = arr.filter(val => val < parseInt(refval));
		return res;
	}

	$scope.smallerThenFilter = function (prop, val) {
		return function (item) {
			return (item[prop] < val);
		}
	}

	$scope.filterModules = function (version) {
		return function (item) {

			if (!item.condition || !item.condition.length) {
				return true;
			}

			return $scope.$eval(item.condition.replaceAll('VERSION', version.VERSION));
		}
	}

	$scope.biggerThenFilter = function (prop, val) {
		return function (item) {
			return (item[prop] > val);
		}
	}

	$scope.mcuChanged = function () {
		document.getElementById('loadingtext').innerText = "Fetching MCU...this may take a while";
		document.getElementById('reloading').style.display = "block";
		setTimeout(function () {
			updateScope(document.getElementById('BOARD'), null);
			updateBoardmap($scope);
		}, 50);
	};

	$scope.boardChanged = function () {
		document.getElementById('loadingtext').innerText = "Fetching MCU...this may take a while";
		document.getElementById('reloading').style.display = "block";
		setTimeout(function () {
			updateBoardmap($scope);
		}, 50);
	};

	$scope.tmcChanged = function () {
		updateHAL($scope);
	};

	$scope.definedPins = function () {
		var pins = $scope.UCNCPINS.map(x => x.pin);
		$scope.DEFINED_PINS = [];
		pins.forEach(pin => {
			if (!($scope.DYNAMIC['PINS'] === null || $scope.DYNAMIC['PINS'] === undefined) && !($scope.DYNAMIC['PINS'][pin] === null || $scope.DYNAMIC['PINS'][pin] === undefined) && ($scope.DYNAMIC['PINS'][pin]['BIT'] !== null || $scope.DYNAMIC['PINS'][pin]['IO_OFFSET'] !== null)) {
				switch ($scope.MCU) {
					case 'MCU_ESP8266':
					case 'MCU_ESP32':
					case 'MCU_RP2040':
						$scope.DEFINED_PINS.push(pin);
						break;
					default:
						if ($scope.DYNAMIC['PINS'][pin]['PORT'] !== null) {
							$scope.DEFINED_PINS.push(pin);
						}
						break;
				}

			}
		});

	};

	$scope.toolChanged = function (tool, contents) {

		if (contents['JSON_BUILD'] !== null) {
			var build = JSON.parse(contents['JSON_BUILD']);
			for (const [k, v] of Object.entries(build)) {
				updateScope(document.getElementById(k), v);
			}
			$scope.definedPins();
			document.querySelectorAll('input[type=radio]').forEach((e, i, p) => {
				updateScope(e, getScope(e).toString());
			});
			$scope.JSON_BUILD = null;
		}
		else {
			updateTool($scope, getScope(document.querySelector('#TOOL' + tool.x)));
		}
	};

	$scope.buildName = function (pre = '', mid = '', post = '') {
		return pre + mid + post;
	};

	$scope.expEval = function (scope = null, exp = '') {
		const regex = /{{(?<params>[^}]*)}}/gm;
		const m = exp.match(regex)[0].replaceAll('{', '').replaceAll('}', '');
		const names = m.split('.');
		switch (names.length) {
			case 1:
				return exp.replace(regex, scope[names[0]]);
			case 2:
				return exp.replace(regex, scope[names[0]][names[1]]);
		}

		return exp;
	}

	$scope.checkGroupClick = function (elem) {
		var input = document.getElementById(elem);
		var model = angular.element(input);
		var mask = 0;

		document.querySelectorAll('[checkgroup="' + elem + '"]').forEach((e, i, p) => {
			if (e.checked) {
				mask = mask + parseInt(e.getAttribute('ng-true-value'));
			}
		});


		updateScope(input, mask);
	};

	$scope.checkGroupInit = function (node, mask, val) {
		if (!node) {
			return;
		}

		var v = (mask & val)/* ? 1 : 0*/;
		var arr = node.split('.');

		if (arr.length > 0 && !$scope[arr[0]]) {
			$scope[arr[0]] = (arr.length == 1) ? v : {};
		}
		else if (arr.length == 1) {
			$scope[arr[0]] = (arr.length == 1) ? v : {};
		}

		if (arr.length > 1 && !$scope[arr[0]][arr[1]]) {
			$scope[arr[0]][arr[1]] = (arr.length == 2) ? v : {};
		}
		else if (arr.length == 2) {
			$scope[arr[0]][arr[1]] = (arr.length == 2) ? v : {};
		}

		if (arr.length > 2 && !$scope[arr[0]][arr[1]][arr[2]]) {
			$scope[arr[0]][arr[1]][arr[2]] = (arr.length == 3) ? v : {};
		}
		else if (arr.length == 3) {
			$scope[arr[0]][arr[1]][arr[2]] = (arr.length == 3) ? v : {};
		}

		if (arr.length > 3 && !$scope[arr[0]][arr[1]][arr[2]][arr[3]]) {
			$scope[arr[0]][arr[1]][arr[2]][arr[3]] = (arr.length == 4) ? v : {};
		}
		else if (arr.length == 4) {
			$scope[arr[0]][arr[1]][arr[2]][arr[3]] = (arr.length == 4) ? v : {};
		}
	}

	$scope.checkGroupInit2 = function () {
		document.querySelectorAll('[checkgroup-display]').forEach((e, i, p) => {
			var input = document.getElementById(e.id);
			var model = angular.element(input);

			var val = model.val();
			var mask = parseInt(val);
			if (input && mask) {
				setTimeout(function () {
					document.querySelectorAll('[checkgroup="' + e.id + '"]').forEach((e, i, p) => {
						if (mask & parseInt(e.getAttribute('ng-true-value'))) {
							e.checked = true;
						}
					});
				}.bind(e), 500);
			}
		});
	};

	$scope.prebuildSelected = function () {
		document.getElementById('loadingtext').innerText = "Fetching configuration...";
		document.getElementById('reloading').style.display = "block";
		var txtFile = new XMLHttpRequest();
		txtFile.open("GET", document.getElementById('PRE_BUILD_FILE').value, true);
		txtFile.onreadystatechange = function () {
			if (txtFile.readyState === 4 && txtFile.status === 200) {  // Makes sure it's found the file.
				$scope.JSON_BUILD = txtFile.responseText;
				var build = JSON.parse($scope.JSON_BUILD);
				loadingfile = true;
				for (const [k, v] of Object.entries(build)) {
					updateScope(document.getElementById(k), v);
				}
				$scope.definedPins();
				document.querySelectorAll('input[type=radio]').forEach((e, i, p) => {
					updateScope(e, getScope(e).toString());
				});

				setTimeout(function () {
					for (const [k, v] of Object.entries(build)) {
						updateScope(document.getElementById(k), v);
					}
					$scope.definedPins();
					document.querySelectorAll('input[type=radio]').forEach((e, i, p) => {
						updateScope(e, getScope(e).toString());
					});
					loadingfile = false;
					document.getElementById('reloading').style.display = "none";
				}, 5000);
			}
		}
		txtFile.onerror = function () {
			document.getElementById('reloading').style.display = "none";
		}
		txtFile.send(null);
	};
}]);

var orfilter = app.filter("orTypeFilter", function () {
	return function (items, arg) {
		var filtered = [];
		angular.forEach((items), function (value, key) {
			arg.forEach((tag) => {
				if (value.type.includes(tag)) {
					this.push(value);
				}
			});
		}, filtered);
		return [... new Set(filtered)];
	}
});

var rangefilter = app.filter("range", function () {
	//our function will need three arguments 
	return function (items, greaterThan, lowerThan) {
		//then we filter the array with dedicated ES5 method
		items = items.filter(function (item) {
			//if item price is included between the two boundaries we return true
			return item > greaterThan && item < lowerThan;
		});

		//then we return the filtered items array
		return items;
	};
});

ready(function () {
	var scope = angular.element(document.querySelector('#MCU')).scope();
	document.addEventListener('boardloaded', function (e) {
		updateHAL(scope);
	});
	scope.boardChanged();
	scope.checkGroupInit();

	// fetch('https://api.github.com/repos/Paciente8159/uCNC-config-builder/contents/pre-configs/').then((resp) => {
	// 	resp.json().then((data) => {
	// 		debugger;
	// 		scope.PREBUILD_CONFIGS = data;
	// 		scope.$apply();
	// 	});
	// });
});

function download(filename, text) {
	var element = document.createElement('a');
	element.setAttribute('href', 'data:text/plain;charset=utf-8,' + encodeURIComponent(text));
	element.setAttribute('download', filename);

	element.style.display = 'none';
	document.body.appendChild(element);

	element.click();

	document.body.removeChild(element);
}

function generate_user_config(options, defguard, reset_file = "", close = true) {
	var gentext = '#ifndef ' + defguard + '\n#define ' + defguard + '\n#ifdef __cplusplus\nextern "C"\n{\n#endif\n\n';
	if (reset_file !== "") {
		gentext += "#include \"" + reset_file + ".h\"\n";
	}

	for (var i = 0; i < options.length; i++) {
		var node = document.querySelector("#" + options[i]);
		if (node) {
			if (reset_file === "") {
				// gentext += "//undefine " + options[i] + "\n";
				// gentext += "#ifdef " + options[i] + "\n#undef " + options[i] + "\n#endif\n";
				gentext += "#undef " + options[i] + "\n";
			}
			else {
				switch (node.type) {
					case 'select-one':
						if (getScope(node) != null) {
							// gentext += "//apply new definition of " + options[i] + "\n";
							gentext += "#define " + options[i] + " " + getScope(node) + "\n";
						}
						break;
					case 'checkbox':
						if (node.checked) {
							// gentext += "//apply new definition of " + options[i] + "\n";
							gentext += "#define " + options[i] + "\n";
						}
						else if (node.getAttribute("var-type") === "bool") {
							// gentext += "//apply new definition of " + options[i] + "\n";
							gentext += "#define " + options[i] + " false\n";
						}
						break;
					default:
						// gentext += "//apply new definition of " + options[i] + "\n";
						gentext += "#define " + options[i] + " " + getScope(node) + "\n";
						break;
				}
			}
		}

	}

	if (close) {
		gentext += '\n#ifdef __cplusplus\n}\n#endif\n#endif\n';
	}
	return gentext;
}

document.getElementById('boardmap_overrides').addEventListener('click', function () {
	var exclude = [...document.querySelectorAll('.ng-hide [config-file="boardmap"]')].map(x => x.id);
	var overrides = generate_user_config([...document.querySelectorAll('[config-file="boardmap"]')].filter(y => !exclude.includes(y.id)).map(x => x.id), 'BOADMAP_OVERRIDES_H', "boardmap_reset", false);
	overrides += "//Custom configurations\n" + document.getElementById('CUSTOM_BOARDMAP_CONFIGS').value + '\n\n#ifdef __cplusplus\n}\n#endif\n#endif\n';
	download('boardmap_overrides.h', overrides);
});

document.getElementById('boardmap_reset').addEventListener('click', function () {
	var overrides = generate_user_config([...document.querySelectorAll('[config-file="boardmap"]')].map(x => x.id), 'BOADMAP_RESET_H', '', false);
	var customs = document.getElementById('CUSTOM_BOARDMAP_CONFIGS').value;
	var defs = [...customs.matchAll(/#define[\s]+(?<def>[\w_]+)/gm)];
	defs.forEach((e) => {
		overrides += "#undef " + e[1] + "\n";
	});
	overrides += '\n#ifdef __cplusplus\n}\n#endif\n#endif\n';
	download('boardmap_reset.h', overrides);
});

document.getElementById('cnc_hal_reset').addEventListener('click', function () {
	var overrides = generate_user_config([...document.querySelectorAll('[config-file="hal"]')].map(x => x.id), 'CNC_HAL_RESET_H', '', false);
	var customs = document.getElementById('CUSTOM_HAL_CONFIGS').value;
	var defs = [...customs.matchAll(/#define[\s]+(?<def>[\w_]+)/gm)];
	defs.forEach((e) => {
		overrides += "#undef " + e[1] + "\n";
	});
	overrides += '\n#ifdef __cplusplus\n}\n#endif\n#endif\n';
	download('cnc_hal_reset.h', overrides);
});

document.getElementById('cnc_hal_overrides').addEventListener('click', function () {
	var exclude = [...document.querySelectorAll('.ng-hide [config-file="hal"]')].map(x => x.id);
	var overrides = generate_user_config([...document.querySelectorAll('[config-file="hal"]')].filter(y => !exclude.includes(y.id)).map(x => x.id), 'CNC_HAL_OVERRIDES_H', "cnc_hal_reset", false);
	var modules = [...document.querySelectorAll('[config-file=module]:checked')].map(x => x.id);

	overrides += "//Custom configurations\n" + document.getElementById('CUSTOM_HAL_CONFIGS').value + "\n";

	if (modules.length) {
		overrides += "\n#define LOAD_MODULES_OVERRIDE() ({"
		for (var i = 0; i < modules.length; i++) {
			overrides += "LOAD_MODULE(" + modules[i] + ");";
		}
		overrides += "})\n"
	}

	overrides += '\n#ifdef __cplusplus\n}\n#endif\n#endif\n';

	download('cnc_hal_overrides.h', overrides);
});

document.getElementById('store_settings').addEventListener('click', function () {
	var key_values = {};
	document.querySelectorAll('[config-file]').forEach((e, i, p) => {
		key_values[e.id] = getScope(e);
	});

	download('ucnc_build.json', JSON.stringify(key_values));
});

document.getElementById('load_settings').addEventListener('change', function (e) {
	var file = e.target.files[0];
	if (!file) {
		return;
	}
	var scope = angular.element(document.getElementById("uCNCapp")).scope();
	scope.PREV_MCU = scope.MCU;
	scope.PREV_BOARD = scope.BOARD;
	var reader = new FileReader();
	document.getElementById('loadingtext').innerText = "Synchronizing fields...";
	document.getElementById('reloading').style.display = "block";
	reader.onload = function (e) {
		scope.JSON_BUILD = e.target.result;
		var build = JSON.parse(scope.JSON_BUILD);
		loadingfile = true;
		for (const [k, v] of Object.entries(build)) {
			updateScope(document.getElementById(k), v);
		}
		scope.definedPins();
		document.querySelectorAll('input[type=radio]').forEach((e, i, p) => {
			updateScope(e, getScope(e).toString());
		});

		setTimeout(function () {
			for (const [k, v] of Object.entries(build)) {
				updateScope(document.getElementById(k), v);
			}
			scope.definedPins();
			document.querySelectorAll('input[type=radio]').forEach((e, i, p) => {
				updateScope(e, getScope(e).toString());
			});
			loadingfile = false;
			document.getElementById('reloading').style.display = "none";
		}, 5000);
	};
	reader.readAsText(file);

}, false);