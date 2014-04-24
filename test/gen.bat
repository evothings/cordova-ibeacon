call cordova create build com.evothings.ibeacon.test ibTest --src=www
cd build
call cordova platform add android
call cordova plugin add ..\..\..\cordova-ble
copy ..\..\ibeacon.js www\js\ibeacon.js
call cordova build
cd ..
