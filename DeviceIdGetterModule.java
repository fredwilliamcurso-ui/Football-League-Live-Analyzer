package com.flutterwave.raveandroid.rave_core.di;

import com.flutterwave.raveandroid.rave_core.models.DeviceIdGetter;
import dagger.Module;
import dagger.Provides;
import javax.inject.Singleton;

@Module
public class DeviceIdGetterModule {
    private final String deviceId;

    public DeviceIdGetterModule(String deviceId) {
        this.deviceId = deviceId;
    }

    @Provides
    @Singleton
    public DeviceIdGetter provideDeviceIdGetter() {
        return new DeviceIdGetter() {
            @Override
            public String getDeviceId() {
                return deviceId;
            }
        };
    }
}
