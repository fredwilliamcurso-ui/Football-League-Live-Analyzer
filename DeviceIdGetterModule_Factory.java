package com.flutterwave.raveandroid.rave_core.di;

import dagger.internal.Factory;
import javax.annotation.Generated;
import javax.inject.Provider;

@Generated(
    value = "dagger.internal.codegen.ComponentProcessor",
    comments = "https://dagger.dev"
)
@SuppressWarnings({
    "unchecked",
    "rawtypes"
})
public final class DeviceIdGetterModule_Factory implements Factory<DeviceIdGetterModule> {
  private final Provider<String> deviceIdProvider;

  public DeviceIdGetterModule_Factory(Provider<String> deviceIdProvider) {
    this.deviceIdProvider = deviceIdProvider;
  }

  @Override
  public DeviceIdGetterModule get() {
    return newInstance(deviceIdProvider.get());
  }

  public static DeviceIdGetterModule_Factory create(Provider<String> deviceIdProvider) {
    return new DeviceIdGetterModule_Factory(deviceIdProvider);
  }

  public static DeviceIdGetterModule newInstance(String deviceId) {
    return new DeviceIdGetterModule(deviceId);
  }
}
