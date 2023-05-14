const boardloaded = new Event('boardloaded');
const halloaded = new Event('halloaded');
const toolloaded = new Event('toolloaded');

function ready(fn) {
	if (document.readyState !== 'loading') {
		fn();
	} else {
		document.addEventListener('DOMContentLoaded', fn);
	}
}

function parsePreprocessor(file, settings = [], callback) {
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
				callback(settings);
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
		case 'int':
			v = (val) ? parseInt(val) : null;
			break;
		case 'float':
			v = (val) ? parseFloat(val) : null;
			break;
		case 'bool':
			v = (val) ? (val === 'true') : false;
		default:
			v = (val) ? val : null;
			break;
	}

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

	if (val) {
		scope.$apply();
	}
}

function updateFields(settings = [], loadedevent = null) {
	document.getElementById('loadingtext').innerText = "Synchronizing fields...";
	document.getElementById('reloading').style.display = "block";
	for (var s in settings) {
		if (settings.hasOwnProperty(s)) {
			var node = document.querySelector("#" + s);
			// if(s=="STEPPER0_RSENSE"){debugger;}
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
	const excludeids = ['MCU', 'BOARD', 'AXIS_COUNT', 'TOOL_COUNT', 'KINEMATIC', 'ENABLE_COOLANT', 'BAUDRATE'];

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
	var coreurl = "https://raw.githubusercontent.com/Paciente8159/uCNC/" + getScope(document.getElementById('VERSION'));
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
	var coreurl = "https://raw.githubusercontent.com/Paciente8159/uCNC/" + getScope(document.getElementById('VERSION'));
	var tool = coreurl + "/uCNC/src/hal/tools/tools/" + tool + ".c";

	if (!tool) {
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
	document.getElementById('loadingtext').innerText = "Fetching processor...";
	document.getElementById('reloading').style.display = "block";
	var settings = [];
	var coreurl = "https://raw.githubusercontent.com/Paciente8159/uCNC/" + getScope(document.getElementById('VERSION'));

	var mcuurl = coreurl + "/uCNC/src/hal/mcus/";

	if (!scope) {
		return;
	}

	if (scope.MCU === scope.PREV_MCU && scope.BOARD === scope.PREV_BOARD) {
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
				boardurl = boardurl + "boardmap_wemos_d1.h";
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
			default:
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

	$scope.VERSIONS = [
		'master',
		'v1.7.1',
		'v1.7.0',
		'v1.7.0-beta',
		'v1.6.2',
		'v1.6.1',
		'v1.6.0',
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
		{ id: 'KINEMATIC_CARTESIAN', name: 'Cartesian' },
		{ id: 'KINEMATIC_COREXY', name: 'Core XY' },
		{ id: 'KINEMATIC_DELTA', name: 'Linear delta' }
	];

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
		{ pin: 'STEP0', type: 'special_output' },
		{ pin: 'STEP1', type: 'special_output' },
		{ pin: 'STEP2', type: 'special_output' },
		{ pin: 'STEP3', type: 'special_output' },
		{ pin: 'STEP4', type: 'special_output' },
		{ pin: 'STEP5', type: 'special_output' },
		{ pin: 'STEP6', type: 'special_output' },
		{ pin: 'STEP7', type: 'special_output' },
		{ pin: 'DIR0', type: 'special_output' },
		{ pin: 'DIR1', type: 'special_output' },
		{ pin: 'DIR2', type: 'special_output' },
		{ pin: 'DIR3', type: 'special_output' },
		{ pin: 'DIR4', type: 'special_output' },
		{ pin: 'DIR5', type: 'special_output' },
		{ pin: 'DIR6', type: 'special_output' },
		{ pin: 'DIR7', type: 'special_output' },
		{ pin: 'STEP0_EN', type: 'special_output' },
		{ pin: 'STEP1_EN', type: 'special_output' },
		{ pin: 'STEP2_EN', type: 'special_output' },
		{ pin: 'STEP3_EN', type: 'special_output' },
		{ pin: 'STEP4_EN', type: 'special_output' },
		{ pin: 'STEP5_EN', type: 'special_output' },
		{ pin: 'STEP6_EN', type: 'special_output' },
		{ pin: 'STEP7_EN', type: 'special_output' },
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
		{ pin: 'DOUT0', type: 'generic_output' },
		{ pin: 'DOUT1', type: 'generic_output' },
		{ pin: 'DOUT2', type: 'generic_output' },
		{ pin: 'DOUT3', type: 'generic_output' },
		{ pin: 'DOUT4', type: 'generic_output' },
		{ pin: 'DOUT5', type: 'generic_output' },
		{ pin: 'DOUT6', type: 'generic_output' },
		{ pin: 'DOUT7', type: 'generic_output' },
		{ pin: 'DOUT8', type: 'generic_output' },
		{ pin: 'DOUT9', type: 'generic_output' },
		{ pin: 'DOUT10', type: 'generic_output' },
		{ pin: 'DOUT11', type: 'generic_output' },
		{ pin: 'DOUT12', type: 'generic_output' },
		{ pin: 'DOUT13', type: 'generic_output' },
		{ pin: 'DOUT14', type: 'generic_output' },
		{ pin: 'DOUT15', type: 'generic_output' },
		{ pin: 'DOUT16', type: 'generic_output' },
		{ pin: 'DOUT17', type: 'generic_output' },
		{ pin: 'DOUT18', type: 'generic_output' },
		{ pin: 'DOUT19', type: 'generic_output' },
		{ pin: 'DOUT20', type: 'generic_output' },
		{ pin: 'DOUT21', type: 'generic_output' },
		{ pin: 'DOUT22', type: 'generic_output' },
		{ pin: 'DOUT23', type: 'generic_output' },
		{ pin: 'DOUT24', type: 'generic_output' },
		{ pin: 'DOUT25', type: 'generic_output' },
		{ pin: 'DOUT26', type: 'generic_output' },
		{ pin: 'DOUT27', type: 'generic_output' },
		{ pin: 'DOUT28', type: 'generic_output' },
		{ pin: 'DOUT29', type: 'generic_output' },
		{ pin: 'DOUT30', type: 'generic_output' },
		{ pin: 'DOUT31', type: 'generic_output' },
		{ pin: 'LIMIT_X', type: 'interruptable_input' },
		{ pin: 'LIMIT_Y', type: 'interruptable_input' },
		{ pin: 'LIMIT_Z', type: 'interruptable_input' },
		{ pin: 'LIMIT_X2', type: 'interruptable_input' },
		{ pin: 'LIMIT_Y2', type: 'interruptable_input' },
		{ pin: 'LIMIT_Z2', type: 'interruptable_input' },
		{ pin: 'LIMIT_A', type: 'interruptable_input' },
		{ pin: 'LIMIT_B', type: 'interruptable_input' },
		{ pin: 'LIMIT_C', type: 'interruptable_input' },
		{ pin: 'PROBE', type: 'interruptable_input' },
		{ pin: 'ESTOP', type: 'interruptable_input' },
		{ pin: 'SAFETY_DOOR', type: 'interruptable_input' },
		{ pin: 'FHOLD', type: 'interruptable_input' },
		{ pin: 'CS_RES', type: 'interruptable_input' },
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
		{ pin: 'DIN0', type: 'interruptable_input,generic_input' },
		{ pin: 'DIN1', type: 'interruptable_input,generic_input' },
		{ pin: 'DIN2', type: 'interruptable_input,generic_input' },
		{ pin: 'DIN3', type: 'interruptable_input,generic_input' },
		{ pin: 'DIN4', type: 'interruptable_input,generic_input' },
		{ pin: 'DIN5', type: 'interruptable_input,generic_input' },
		{ pin: 'DIN6', type: 'interruptable_input,generic_input' },
		{ pin: 'DIN7', type: 'interruptable_input,generic_input' },
		{ pin: 'DIN8', type: 'generic_input' },
		{ pin: 'DIN9', type: 'generic_input' },
		{ pin: 'DIN10', type: 'generic_input' },
		{ pin: 'DIN11', type: 'generic_input' },
		{ pin: 'DIN12', type: 'generic_input' },
		{ pin: 'DIN13', type: 'generic_input' },
		{ pin: 'DIN14', type: 'generic_input' },
		{ pin: 'DIN15', type: 'generic_input' },
		{ pin: 'DIN16', type: 'generic_input' },
		{ pin: 'DIN17', type: 'generic_input' },
		{ pin: 'DIN18', type: 'generic_input' },
		{ pin: 'DIN19', type: 'generic_input' },
		{ pin: 'DIN20', type: 'generic_input' },
		{ pin: 'DIN21', type: 'generic_input' },
		{ pin: 'DIN22', type: 'generic_input' },
		{ pin: 'DIN23', type: 'generic_input' },
		{ pin: 'DIN24', type: 'generic_input' },
		{ pin: 'DIN25', type: 'generic_input' },
		{ pin: 'DIN26', type: 'generic_input' },
		{ pin: 'DIN27', type: 'generic_input' },
		{ pin: 'DIN28', type: 'generic_input' },
		{ pin: 'DIN29', type: 'generic_input' },
		{ pin: 'DIN30', type: 'generic_input' },
		{ pin: 'DIN31', type: 'generic_input' },
		{ pin: 'TX', type: 'special_output' },
		{ pin: 'RX', type: 'special input' },
		{ pin: 'USB_DM', type: 'special_output' },
		{ pin: 'USB_DP', type: 'special_output' },
		{ pin: 'SPI_CLK', type: 'special_output' },
		{ pin: 'SPI_SDI', type: 'special input' },
		{ pin: 'SPI_SDO', type: 'special_output' },
		{ pin: 'SPI_CS', type: 'special_output' },
		{ pin: 'I2C_SCL', type: 'special input' },
		{ pin: 'I2C_SDA', type: 'special input' }
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
		{ pin: 31, mcu: 'MCU_SAMD21,MCU_LPC176X,MCU_ESP8266,MCU_ESP32' }
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
		{ port: '2', mcu: 'MCU_LPC176X' }
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
		{ channel: 0, mcu: 'MCU_SAMD21,MCU_STM32F1X,MCU_STM32F4X,MCU_LPC176X' },
		{ channel: 1, mcu: 'MCU_SAMD21,MCU_STM32F1X,MCU_STM32F4X,MCU_LPC176X' },
		{ channel: 2, mcu: 'MCU_SAMD21,MCU_STM32F1X,MCU_STM32F4X,MCU_LPC176X' },
		{ channel: 3, mcu: 'MCU_SAMD21,MCU_STM32F1X,MCU_STM32F4X,MCU_LPC176X' },
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
		{ timer: 0, mcu: 'MCU_AVR,MCU_SAMD21,MCU_STM32F1X,MCU_STM32F4X,MCU_LPC176X,MCU_RP2040' },
		{ timer: 1, mcu: 'MCU_AVR,MCU_SAMD21,MCU_STM32F1X,MCU_STM32F4X,MCU_LPC176X,MCU_RP2040' },
		{ timer: 2, mcu: 'MCU_AVR,MCU_SAMD21,MCU_STM32F1X,MCU_STM32F4X,MCU_LPC176X,MCU_RP2040' },
		{ timer: 3, mcu: 'MCU_AVR,MCU_SAMD21,MCU_STM32F1X,MCU_STM32F4X,MCU_LPC176X,MCU_RP2040' },
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
		{ timer: 'ITP', mcu: 'MCU_AVR,MCU_SAMD21,MCU_STM32F1X,MCU_STM32F4X,MCU_LPC176X,ESP32,MCU_RP2040' },
		{ timer: 'RTC', mcu: 'MCU_AVR,MCU_RP2040' },
		{ timer: 'SERVO', mcu: 'MCU_AVR,MCU_SAMD21,MCU_STM32F1X,MCU_STM32F4X,MCU_LPC176X,ESP32,MCU_RP2040' },
		{ timer: 'ONESHOT', mcu: 'MCU_AVR,MCU_SAMD21,MCU_STM32F1X,MCU_STM32F4X,MCU_LPC176X,ESP32,MCU_RP2040' }
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
		{ id: 'pen_servo', name: 'Pen Servo' }
	];

	$scope.MODULES_OPTIONS = [
		{ id: 'parser_g5', name: 'Linux CNC G5 and G5.1 and allows to make motions based on splines via control points' },
		{ id: 'parser_g7_g8', name: 'Linux CNC G7/G8 to set radius mode for lathes' },
		{ id: 'parser_g33', name: 'Linux CNC G33 and allows to make motions synched with the spindle' },
		{ id: 'parser_m17_m18', name: 'Marlin M17-M18 and allows enable/disable stepper motors' },
		{ id: 'parser_m42', name: 'Marlin M42 and allows to turn on and off any generic digital pin, PWM or servo pin' },
		{ id: 'parser_m62_m65', name: 'LinuxCNC M62-M65 and allows to turn on and off any generic digital pin (synched or immediately)' },
		{ id: 'parser_m67_m68', name: 'LinuxCNC M67-M68 and allows to turn on and off any analog pin (synched or immediately)' },
		{ id: 'parser_m80_m81', name: 'Marlin M80-M81 and allows to turn on and off a pin controling the PSU' },
		{ id: 'i2c_lcd', name: 'Support for an I2C LCD that display the current machine position and limits state' },
		{ id: 'smoothie_clustering', name: 'Smoothieware S Cluster support' },
		{ id: 'graphic_display', name: 'Support for RepRap Full Graphic Display' },
		{ id: 'sd_card', name: 'Support for SD/MMC card via hardware/software SPI' },
		{ id: 'sd_card_pf', name: 'Support for SD/MMC card via hardware/software SPI and optional FS (beta)' },
		{ id: 'bltouch', name: 'Support for BLTouch probe' },
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
		{ id: 'TMC_UART', name: 'UART' },
		{ id: 'TMC_SPI', name: 'SPI' },
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

	$scope.numSmallerOrEq = function (arr, ref) {
		var refval = $scope[ref];
		if (!refval) {
			return [];
		}
		const res = arr.filter(val => val <= parseInt(refval));
		return res;
	}

	$scope.mcuChanged = function () {
		updateScope(document.getElementById('BOARD'), null);
		updateBoardmap($scope);
	};

	$scope.boardChanged = function () {
		updateBoardmap($scope);
	};

	$scope.tmcChanged = function () {
		updateHAL($scope);
	};

	$scope.definedPins = function () {
		var pins = $scope.UCNCPINS.map(x => x.pin);
		$scope.DEFINED_PINS = [];
		pins.forEach(pin => {
			if ($scope.DYNAMIC['PINS'] && $scope.DYNAMIC['PINS'][pin] && $scope.DYNAMIC['PINS'][pin]['BIT']) {
				switch ($scope.MCU == '') {
					case 'MCU_ESP8266':
					case 'MCU_ESP32':
					case 'MCU_RP2040':
						$scope.DEFINED_PINS.push(pin);
						break;
					default:
						if ($scope.DYNAMIC['PINS'][pin]['PORT']) {
							$scope.DEFINED_PINS.push(pin);
						}
						break;
				}

			}
		});

	};

	$scope.toolChanged = function (tool) {
		updateTool($scope, getScope(document.querySelector('#TOOL' + tool.x)));
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
}]);

var orfilter = app.filter("orTypeFilter", function () {
	return function (items, arg) {
		var filtered = [];
		angular.forEach(items, function (value, key) {

			if (arg.includes(value.type)) {
				this.push(value);
			}
		}, filtered);
		return filtered;
	}
});

ready(function () {
	var scope = angular.element(document.querySelector('#MCU')).scope();
	document.addEventListener('boardloaded', function (e) {
		updateHAL(scope);
	});
	scope.boardChanged();
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

function generate_user_config(options, defguard, close = true) {
	var gentext = '#ifndef ' + defguard + '\n#define ' + defguard + '\n#ifdef __cplusplus\nextern "C"\n{\n#endif\n';
	for (var i = 0; i < options.length; i++) {
		var node = document.querySelector("#" + options[i]);
		if (node) {
			gentext += "#ifdef " + options[i] + "\n#undef " + options[i] + "\n#endif\n";
			switch (node.type) {
				case 'select-one':
					if (getScope(node) != null) {
						gentext += "#define " + options[i] + " " + getScope(node) + "\n";
					}
					break;
				case 'checkbox':
					if (node.checked) {
						gentext += "#define " + options[i] + "\n";
					}
					else if(node.getAttribute("var-type")==="bool")
					{
						gentext += "#define " + options[i] + " false\n";
					}
					break;
				default:
					gentext += "#define " + options[i] + " " + getScope(node) + "\n";
					break;
			}
		}

	}

	if (close) {
		gentext += '\n#ifdef __cplusplus\n}\n#endif\n#endif\n';
	}
	return gentext;
}

document.getElementById('boardmap_overrides').addEventListener('click', function () {
	download('boardmap_overrides.h', generate_user_config([...document.querySelectorAll('[config-file="boardmap"]')].map(x => x.id), 'BOADMAP_OVERRIDES_H'));
});

document.getElementById('cnc_hal_overrides').addEventListener('click', function () {
	var overrides = generate_user_config([...document.querySelectorAll('[config-file="hal"]')].map(x => x.id), 'CNC_HAL_OVERRIDES_H', false);
	var modules = [...document.querySelectorAll('[config-file=module]:checked')].map(x => x.id);

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
	var reader = new FileReader();
	reader.onload = function (e) {
		var contents = e.target.result;
		var build = JSON.parse(contents);
		for (const [k, v] of Object.entries(build)) {
			updateScope(document.getElementById(k), v);
		}
	};
	reader.readAsText(file);
}, false);