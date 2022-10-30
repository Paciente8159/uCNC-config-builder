function parsePreprocessor(file, settings = [], callback) {
	const defineregex = /^[\s]*#define[\s]+(?<def>[\w\d]+)[\s]+(?<val>[\-\w\d]*)/gm
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
	txtFile.send(null);
}

function updateBoardmap() {
	var settings = [];
	var url = "https://raw.githubusercontent.com/Paciente8159/uCNC/" + version + "/uCNC/src/hal/boards/";
	switch (document.querySelector('#BOARD').value) {
		case 'BOARD_UNO':
		case 'BOARD_MKS_DLC':
		case 'BOARD_X_CONTROLLER':
			url = url + "avr/boardmap_uno.h";
			break;
		case 'BOARD_RAMBO14':
		case 'BOARD_MKS_GEN_L_V1':
			url = url + "avr/boardmap_rambo14.h";
			break;
		case 'BOARD_RAMPS14':
			url = url + "avr/boardmap_ramps14.h";
			break;
		case 'BOARD_BLUEPILL':
			url = url + "stm32/boardmap_bluepill.h";
			break;
		case 'BOARD_BLACKPILL':
			url = url + "stm32/boardmap_blackpill.h";
			break;
		case 'BOARD_MKS_ROBIN_NANO_V1_2':
			url = url + "stm32/boardmap_mks_robin_nano_v1_2.h";
			break;
		case 'BOARD_SKR_PRO_V1_2':
			url = url + "stm32/boardmap_srk_pro_v1_2.h";
			break;
		case 'BOARD_MZERO':
			url = url + "samd21/boardmap_mzero.h";
			break;
		case 'BOARD_ZERO':
			url = url + "samd21/boardmap_zero.h";
			break;
		case 'BOARD_RE_ARM':
			url = url + "lpc176x/boardmap_re_arm.h";
			break;
		case 'BOARD_MKS_BASE13':
			url = url + "lpc176x/boardmap_mks_base13.h";
			break;
		case 'BOARD_SKR_V14_TURBO':
			url = url + "lpc176x/boardmap_skr_v14_turbo.h";
			break;
		case 'BOARD_WEMOS_D1':
			url = url + "boardmap_wemos_d1.h";
			break;
		case 'BOARD_WEMOS_D1_R32':
			url = url + "esp32/boardmap_wemos_d1_r32.h";
			break;
		case 'BOARD_MKS_TINYBEE':
			url = url + "esp32/boardmap_mks_tinybee.h";
			break;
		case 'BOARD_MKS_DLC32':
			url = url + "esp32/boardmap_mks_dlc32.h";
			break;
		default:
			return;
	}

	parsePreprocessor(url, settings, function (newsettings) {
		settings = newsettings;
		for (var s in settings) {
			if (settings.hasOwnProperty(s)) {
				var node = document.querySelector("#" + s);
				if (node) {
					switch (node.type) {
						case 'select-one':
							node.value = settings[s];
							break;
						case 'checkbox':
							node.checked = true;
							break;
						default:
							node.value = settings[s];
							break;
					}
				}
			}
		}
	});
}

var version = 'v1.5.4';
var app = angular.module("uCNCapp", []);
var controller = app.controller('uCNCcontroller', ['$scope', '$rootScope', function ($scope, $rootScope) {
	$scope.MCUS = [
		{ id: 'MCU_AVR', name: 'Atmel AVR' },
		{ id: 'MCU_SAMD21', name: 'Atmel SAMD21' },
		{ id: 'MCU_STM32F1X', name: 'STM32F1x' },
		{ id: 'MCU_STM32F4X', name: 'STM32F4X' },
		{ id: 'MCU_LPC176X', name: 'LPC176X' },
		{ id: 'MCU_ESP8266', name: 'ESP8266' },
		{ id: 'MCU_ESP32', name: 'ESP32' }
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
		{ id: 'BOARD_CUSTOM', name: 'Custom board', mcu: 'MCU_AVR,MCU_SAMD21,MCU_STM32F1X,MCU_STM32F4X,MCU_LPC176X,MCU_ESP8266,MCU_ESP32' }
	];

	$scope.UCNCPINS = [
		{ pin: 'STEP0', type: 'special output' },
		{ pin: 'STEP1', type: 'special output' },
		{ pin: 'STEP2', type: 'special output' },
		{ pin: 'STEP3', type: 'special output' },
		{ pin: 'STEP4', type: 'special output' },
		{ pin: 'STEP5', type: 'special output' },
		{ pin: 'STEP6', type: 'special output' },
		{ pin: 'STEP7', type: 'special output' },
		{ pin: 'DIR0', type: 'special output' },
		{ pin: 'DIR1', type: 'special output' },
		{ pin: 'DIR2', type: 'special output' },
		{ pin: 'DIR3', type: 'special output' },
		{ pin: 'DIR4', type: 'special output' },
		{ pin: 'DIR5', type: 'special output' },
		{ pin: 'DIR6', type: 'special output' },
		{ pin: 'DIR7', type: 'special output' },
		{ pin: 'STEP0_EN', type: 'special output' },
		{ pin: 'STEP1_EN', type: 'special output' },
		{ pin: 'STEP2_EN', type: 'special output' },
		{ pin: 'STEP3_EN', type: 'special output' },
		{ pin: 'STEP4_EN', type: 'special output' },
		{ pin: 'STEP5_EN', type: 'special output' },
		{ pin: 'STEP6_EN', type: 'special output' },
		{ pin: 'STEP7_EN', type: 'special output' },
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
		{ pin: 'SERVO0', type: 'special output' },
		{ pin: 'SERVO1', type: 'special output' },
		{ pin: 'SERVO2', type: 'special output' },
		{ pin: 'SERVO3', type: 'special output' },
		{ pin: 'SERVO4', type: 'special output' },
		{ pin: 'SERVO5', type: 'special output' },
		{ pin: 'DOUT0', type: 'output' },
		{ pin: 'DOUT1', type: 'output' },
		{ pin: 'DOUT2', type: 'output' },
		{ pin: 'DOUT3', type: 'output' },
		{ pin: 'DOUT4', type: 'output' },
		{ pin: 'DOUT5', type: 'output' },
		{ pin: 'DOUT6', type: 'output' },
		{ pin: 'DOUT7', type: 'output' },
		{ pin: 'DOUT8', type: 'output' },
		{ pin: 'DOUT9', type: 'output' },
		{ pin: 'DOUT10', type: 'output' },
		{ pin: 'DOUT11', type: 'output' },
		{ pin: 'DOUT12', type: 'output' },
		{ pin: 'DOUT13', type: 'output' },
		{ pin: 'DOUT14', type: 'output' },
		{ pin: 'DOUT15', type: 'output' },
		{ pin: 'DOUT16', type: 'output' },
		{ pin: 'DOUT17', type: 'output' },
		{ pin: 'DOUT18', type: 'output' },
		{ pin: 'DOUT19', type: 'output' },
		{ pin: 'DOUT20', type: 'output' },
		{ pin: 'DOUT21', type: 'output' },
		{ pin: 'DOUT22', type: 'output' },
		{ pin: 'DOUT23', type: 'output' },
		{ pin: 'DOUT24', type: 'output' },
		{ pin: 'DOUT25', type: 'output' },
		{ pin: 'DOUT26', type: 'output' },
		{ pin: 'DOUT27', type: 'output' },
		{ pin: 'DOUT28', type: 'output' },
		{ pin: 'DOUT29', type: 'output' },
		{ pin: 'DOUT30', type: 'output' },
		{ pin: 'DOUT31', type: 'output' },
		{ pin: 'LIMIT_X', type: 'input_interruptable' },
		{ pin: 'LIMIT_Y', type: 'input_interruptable' },
		{ pin: 'LIMIT_Z', type: 'input_interruptable' },
		{ pin: 'LIMIT_X2', type: 'input_interruptable' },
		{ pin: 'LIMIT_Y2', type: 'input_interruptable' },
		{ pin: 'LIMIT_Z2', type: 'input_interruptable' },
		{ pin: 'LIMIT_A', type: 'input_interruptable' },
		{ pin: 'LIMIT_B', type: 'input_interruptable' },
		{ pin: 'LIMIT_C', type: 'input_interruptable' },
		{ pin: 'PROBE', type: 'input_interruptable' },
		{ pin: 'ESTOP', type: 'input_interruptable' },
		{ pin: 'SAFETY_DOOR', type: 'input_interruptable' },
		{ pin: 'FHOLD', type: 'input_interruptable' },
		{ pin: 'CS_RES', type: 'input_interruptable' },
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
		{ pin: 'DIN0', type: 'input_interruptable' },
		{ pin: 'DIN1', type: 'input_interruptable' },
		{ pin: 'DIN2', type: 'input_interruptable' },
		{ pin: 'DIN3', type: 'input_interruptable' },
		{ pin: 'DIN4', type: 'input_interruptable' },
		{ pin: 'DIN5', type: 'input_interruptable' },
		{ pin: 'DIN6', type: 'input_interruptable' },
		{ pin: 'DIN7', type: 'input_interruptable' },
		{ pin: 'DIN8', type: 'input' },
		{ pin: 'DIN9', type: 'input' },
		{ pin: 'DIN10', type: 'input' },
		{ pin: 'DIN11', type: 'input' },
		{ pin: 'DIN12', type: 'input' },
		{ pin: 'DIN13', type: 'input' },
		{ pin: 'DIN14', type: 'input' },
		{ pin: 'DIN15', type: 'input' },
		{ pin: 'DIN16', type: 'input' },
		{ pin: 'DIN17', type: 'input' },
		{ pin: 'DIN18', type: 'input' },
		{ pin: 'DIN19', type: 'input' },
		{ pin: 'DIN20', type: 'input' },
		{ pin: 'DIN21', type: 'input' },
		{ pin: 'DIN22', type: 'input' },
		{ pin: 'DIN23', type: 'input' },
		{ pin: 'DIN24', type: 'input' },
		{ pin: 'DIN25', type: 'input' },
		{ pin: 'DIN26', type: 'input' },
		{ pin: 'DIN27', type: 'input' },
		{ pin: 'DIN28', type: 'input' },
		{ pin: 'DIN29', type: 'input' },
		{ pin: 'DIN30', type: 'input' },
		{ pin: 'DIN31', type: 'input' },
		{ pin: 'TX', type: 'special output' },
		{ pin: 'RX', type: 'special input' },
		{ pin: 'USB_DM', type: 'special output' },
		{ pin: 'USB_DP', type: 'special output' },
		{ pin: 'SPI_CLK', type: 'special output' },
		{ pin: 'SPI_SDI', type: 'special input' },
		{ pin: 'SPI_SDO', type: 'special output' },
		{ pin: 'SPI_CS', type: 'special output' },
		{ pin: 'I2C_SCL', type: 'special input' },
		{ pin: 'I2C_SDA', type: 'special input' }
	];

	$scope.PINS = [
		{ pin: 0, mcu: 'MCU_AVR,MCU_SAMD21,MCU_STM32F1X,MCU_STM32F4X,MCU_LPC176X,MCU_ESP8266,MCU_ESP32' },
		{ pin: 1, mcu: 'MCU_AVR,MCU_SAMD21,MCU_STM32F1X,MCU_STM32F4X,MCU_LPC176X,MCU_ESP8266,MCU_ESP32' },
		{ pin: 2, mcu: 'MCU_AVR,MCU_SAMD21,MCU_STM32F1X,MCU_STM32F4X,MCU_LPC176X,MCU_ESP8266,MCU_ESP32' },
		{ pin: 3, mcu: 'MCU_AVR,MCU_SAMD21,MCU_STM32F1X,MCU_STM32F4X,MCU_LPC176X,MCU_ESP8266,MCU_ESP32' },
		{ pin: 4, mcu: 'MCU_AVR,MCU_SAMD21,MCU_STM32F1X,MCU_STM32F4X,MCU_LPC176X,MCU_ESP8266,MCU_ESP32' },
		{ pin: 5, mcu: 'MCU_AVR,MCU_SAMD21,MCU_STM32F1X,MCU_STM32F4X,MCU_LPC176X,MCU_ESP8266,MCU_ESP32' },
		{ pin: 6, mcu: 'MCU_AVR,MCU_SAMD21,MCU_STM32F1X,MCU_STM32F4X,MCU_LPC176X,MCU_ESP8266,MCU_ESP32' },
		{ pin: 7, mcu: 'MCU_AVR,MCU_SAMD21,MCU_STM32F1X,MCU_STM32F4X,MCU_LPC176X,MCU_ESP8266,MCU_ESP32' },
		{ pin: 8, mcu: 'MCU_SAMD21,MCU_STM32F1X,MCU_STM32F4X,MCU_LPC176X,MCU_ESP8266,MCU_ESP32' },
		{ pin: 9, mcu: 'MCU_SAMD21,MCU_STM32F1X,MCU_STM32F4X,MCU_LPC176X,MCU_ESP8266,MCU_ESP32' },
		{ pin: 10, mcu: 'MCU_SAMD21,MCU_STM32F1X,MCU_STM32F4X,MCU_LPC176X,MCU_ESP8266,MCU_ESP32' },
		{ pin: 11, mcu: 'MCU_SAMD21,MCU_STM32F1X,MCU_STM32F4X,MCU_LPC176X,MCU_ESP8266,MCU_ESP32' },
		{ pin: 12, mcu: 'MCU_SAMD21,MCU_STM32F1X,MCU_STM32F4X,MCU_LPC176X,MCU_ESP8266,MCU_ESP32' },
		{ pin: 13, mcu: 'MCU_SAMD21,MCU_STM32F1X,MCU_STM32F4X,MCU_LPC176X,MCU_ESP8266,MCU_ESP32' },
		{ pin: 14, mcu: 'MCU_SAMD21,MCU_STM32F1X,MCU_STM32F4X,MCU_LPC176X,MCU_ESP8266,MCU_ESP32' },
		{ pin: 15, mcu: 'MCU_SAMD21,MCU_STM32F1X,MCU_STM32F4X,MCU_LPC176X,MCU_ESP8266,MCU_ESP32' },
		{ pin: 16, mcu: 'MCU_SAMD21,MCU_LPC176X,MCU_ESP8266,MCU_ESP32' },
		{ pin: 17, mcu: 'MCU_SAMD21,MCU_LPC176X,MCU_ESP8266,MCU_ESP33' },
		{ pin: 18, mcu: 'MCU_SAMD21,MCU_LPC176X,MCU_ESP8266,MCU_ESP34' },
		{ pin: 19, mcu: 'MCU_SAMD21,MCU_LPC176X,MCU_ESP8266,MCU_ESP35' },
		{ pin: 20, mcu: 'MCU_SAMD21,MCU_LPC176X,MCU_ESP8266,MCU_ESP36' },
		{ pin: 21, mcu: 'MCU_SAMD21,MCU_LPC176X,MCU_ESP8266,MCU_ESP37' },
		{ pin: 22, mcu: 'MCU_SAMD21,MCU_LPC176X,MCU_ESP8266,MCU_ESP38' },
		{ pin: 23, mcu: 'MCU_SAMD21,MCU_LPC176X,MCU_ESP8266,MCU_ESP39' },
		{ pin: 24, mcu: 'MCU_SAMD21,MCU_LPC176X,MCU_ESP8266,MCU_ESP40' },
		{ pin: 25, mcu: 'MCU_SAMD21,MCU_LPC176X,MCU_ESP8266,MCU_ESP41' },
		{ pin: 26, mcu: 'MCU_SAMD21,MCU_LPC176X,MCU_ESP8266,MCU_ESP42' },
		{ pin: 27, mcu: 'MCU_SAMD21,MCU_LPC176X,MCU_ESP8266,MCU_ESP43' },
		{ pin: 28, mcu: 'MCU_SAMD21,MCU_LPC176X,MCU_ESP8266,MCU_ESP44' },
		{ pin: 29, mcu: 'MCU_SAMD21,MCU_LPC176X,MCU_ESP8266,MCU_ESP45' },
		{ pin: 30, mcu: 'MCU_SAMD21,MCU_LPC176X,MCU_ESP8266,MCU_ESP46' },
		{ pin: 31, mcu: 'MCU_SAMD21,MCU_LPC176X,MCU_ESP8266,MCU_ESP47' }
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
		{ timer: 0, mcu: 'MCU_AVR,MCU_SAMD21,MCU_STM32F1X,MCU_STM32F4X,MCU_LPC176X' },
		{ timer: 1, mcu: 'MCU_AVR,MCU_SAMD21,MCU_STM32F1X,MCU_STM32F4X,MCU_LPC176X' },
		{ timer: 2, mcu: 'MCU_AVR,MCU_SAMD21,MCU_STM32F1X,MCU_STM32F4X,MCU_LPC176X' },
		{ timer: 3, mcu: 'MCU_AVR,MCU_SAMD21,MCU_STM32F1X,MCU_STM32F4X,MCU_LPC176X' },
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

	$scope.MCU = "MCU_AVR";
	$scope.BOARD = "BOARD_UNO";
	$scope.KINEMATIC = "KINEMATIC_CARTESIAN";
	$scope.AXIS_COUNT = '3';
	$scope.TOOL_COUNT = 1;

	$scope.numSmallerOrEq = function (arr, ref) {
		var refval = document.querySelector("#"+ref);
		if(!refval) {
			return [];
		}
		const res = arr.filter(val => val <= parseInt(refval.value));
		return res;
	}

	$scope.boardChanged = updateBoardmap;
}]);

app.directive('ngModelDynamic', ['$compile',
	function ($compile) {
		return {

			restrict: 'A',
			link: function (scope, element, attrs) {
				// Remove ng-model-dynamic to prevent recursive compilation
				element.removeAttr('ng-model-dynamic');

				// Add ng-model with a value set to the now evaluated expression
				element.attr('ng-model', attrs.ngModelDynamic);

				// Recompile the entire element
				$compile(element)(scope);
			}

		}
	}]);

function download(filename, text) {
	var element = document.createElement('a');
	element.setAttribute('href', 'data:text/plain;charset=utf-8,' + encodeURIComponent(text));
	element.setAttribute('download', filename);

	element.style.display = 'none';
	document.body.appendChild(element);

	element.click();

	document.body.removeChild(element);
}

function generate_user_config() {

}

function ready(fn) {
	if (document.readyState !== 'loading') {
		fn();
	} else {
		document.addEventListener('DOMContentLoaded', fn);
	}
}

ready(function () {
	updateBoardmap();
});