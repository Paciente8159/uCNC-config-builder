<?php
$directories = ['AVR', 'SAMD21', 'STM32F0', 'STM32F1', 'STM32F4', 'ESP8266', 'ESP32', 'RP2040'];

// Print the list of files and directories
$output = "<div class=\"mb-3 load-config\">\n";
$output .= "<p>Or you can select one of the pre-configured boards.</p>\n";
$output .= "<select class=\"form-select form-select-md\" name=\"PRE_BUILD_FILE\" id=\"PRE_BUILD_FILE\" ng-model=\"PRE_BUILD_FILE\" ng-change=\"prebuildSelected()\">\n";

foreach ($directories as $directory) {
    $files = scandir($directory);
    foreach ($files as $file) {
        if(str_ends_with($file, 'json')){
            $output .= "<option value=\"https://raw.githubusercontent.com/Paciente8159/uCNC-config-builder/main/pre-configs/$directory/$file\">$directory-$file</option>\n";
        }
    }
}
$output .="</select>\n";
$output .= "</div>\n";
file_put_contents("configs.html", $output);
?>