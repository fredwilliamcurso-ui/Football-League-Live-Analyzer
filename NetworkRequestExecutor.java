package com.flutterwave.raveandroid.rave_java_commons;

import com.google.gson.Gson;
import javax.inject.Inject;
import javax.inject.Singleton;

@Singleton
public class NetworkRequestExecutor {
    private final Gson gson;

    @Inject
    public NetworkRequestExecutor(Gson gson) {
        this.gson = gson;
    }

    public Gson getGson() {
        return gson;
    }
}
