package com.aroinvestment.crm;

import android.os.Bundle;
import android.view.WindowManager;

import com.getcapacitor.BridgeActivity;

public class MainActivity extends BridgeActivity {
    @Override
    public void onCreate(Bundle savedInstanceState) {
        // FLAG_SECURE blocks screenshots/screen recording AND blackens the
        // app preview in the Recent Apps switcher. Applied here (pre-bridge)
        // so the splash/launch screen is also protected, in addition to the
        // PrivacyScreen plugin's runtime guard.
        getWindow().setFlags(
            WindowManager.LayoutParams.FLAG_SECURE,
            WindowManager.LayoutParams.FLAG_SECURE
        );
        super.onCreate(savedInstanceState);
    }
}
