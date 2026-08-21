package com.flutterwave.raveandroid.rave_core.di;

import com.flutterwave.raveandroid.rave_core.models.DeviceIdGetter;
import dagger.internal.Factory;
import dagger.internal.Preconditions;
import javax.annotation.Generated;

@Generated(
    value = "dagger.internal.codegen.ComponentProcessor",
    comments = "https://dagger.dev"
)
@SuppressWarnings({
    "unchecked",
    "rawtypes"
})
public final class DeviceIdGetterModule_ProvideDeviceIdGetterFactory implements Factory<DeviceIdGetter> {
  private final DeviceIdGetterModule module;

  public DeviceIdGetterModule_ProvideDeviceIdGetterFactory(DeviceIdGetterModule module) {
    this.module = module;
  }

  @Override
  public DeviceIdGetter get() {
    return provideDeviceIdGetter(module);
  }

  public static DeviceIdGetterModule_ProvideDeviceIdGetterFactory create(
      DeviceIdGetterModule module) {
    return new DeviceIdGetterModule_ProvideDeviceIdGetterFactory(module);
  }

  public static DeviceIdGetter provideDeviceIdGetter(DeviceIdGetterModule instance) {
    return Preconditions.checkNotNull(instance.provideDeviceIdGetter(), "Cannot return null from a non-@Nullable @Provides method");
  }
}
