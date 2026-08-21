package com.flutterwave.raveandroid.rave_java_commons;

import com.google.gson.Gson;
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
public final class NetworkRequestExecutor_Factory implements Factory<NetworkRequestExecutor> {
  private final Provider<Gson> gsonProvider;

  public NetworkRequestExecutor_Factory(Provider<Gson> gsonProvider) {
    this.gsonProvider = gsonProvider;
  }

  @Override
  public NetworkRequestExecutor get() {
    return newInstance(gsonProvider.get());
  }

  public static NetworkRequestExecutor_Factory create(Provider<Gson> gsonProvider) {
    return new NetworkRequestExecutor_Factory(gsonProvider);
  }

  public static NetworkRequestExecutor newInstance(Gson gson) {
    return new NetworkRequestExecutor(gson);
  }
}
