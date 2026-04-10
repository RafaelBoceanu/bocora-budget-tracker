/*
 * Copyright 2020 Google Inc.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *      http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

// app/src/main/java/app/bocora/twa/LauncherActivity.java
// Implements both:
//   - Banner ad (shown continuously at the bottom)
//   - App Open ad (shown on cold start and when returning from background)

package app.bocora.twa;

import android.os.Bundle;
import android.view.ViewGroup;
import android.widget.LinearLayout;
import android.widget.FrameLayout;
import android.view.Gravity;

import androidx.annotation.NonNull;
import androidx.lifecycle.ProcessLifecycleOwner;
import androidx.lifecycle.DefaultLifecycleObserver;
import androidx.lifecycle.LifecycleOwner;

import com.google.android.gms.ads.AdError;
import com.google.android.gms.ads.AdRequest;
import com.google.android.gms.ads.AdSize;
import com.google.android.gms.ads.AdView;
import com.google.android.gms.ads.FullScreenContentCallback;
import com.google.android.gms.ads.LoadAdError;
import com.google.android.gms.ads.MobileAds;
import com.google.android.gms.ads.appopen.AppOpenAd;

public class LauncherActivity extends com.google.androidbrowserhelper.trusted.LauncherActivity {

    // ── Ad Unit IDs ───────────────────────────────────────────────────────────
    // Replace these test IDs with your real AdMob Ad Unit IDs before release.
    // Test IDs are safe to use during development — they won't generate revenue.
    private static final String BANNER_AD_UNIT_ID   = "ca-app-pub-6461845207268295/8769644321";
    private static final String APP_OPEN_AD_UNIT_ID = "ca-app-pub-6461845207268295/9797165828";

    // ── Banner ────────────────────────────────────────────────────────────────
    private AdView mAdView;

    // ── App Open ──────────────────────────────────────────────────────────────
    private AppOpenAd mAppOpenAd     = null;
    private boolean   mIsShowingAd   = false;
    private boolean   mIsLoadingAd   = false;
    private long      mLoadTimeMs    = 0;
    private static final long AD_EXPIRY_MS = 4 * 60 * 60 * 1000; // 4 hours

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);

        // Initialise the Mobile Ads SDK once, then pre-load App Open ad
        MobileAds.initialize(this, initializationStatus -> loadAppOpenAd());

        setupBannerAd();
        registerLifecycleObserver();
    }

    // ── Banner setup ──────────────────────────────────────────────────────────

    private void setupBannerAd() {
        // The TWA root is a FrameLayout. Wrap it in a vertical LinearLayout
        // so the banner sits below the web content.
        FrameLayout twaRoot = (FrameLayout) getWindow().getDecorView().getRootView();
        ViewGroup parent = (ViewGroup) twaRoot.getParent();

        LinearLayout wrapper = new LinearLayout(this);
        wrapper.setOrientation(LinearLayout.VERTICAL);

        if (parent != null) {
            int index = parent.indexOfChild(twaRoot);
            parent.removeView(twaRoot);
            wrapper.addView(twaRoot, new LinearLayout.LayoutParams(
                    ViewGroup.LayoutParams.MATCH_PARENT, 0, 1f));
            parent.addView(wrapper, index, new ViewGroup.LayoutParams(
                    ViewGroup.LayoutParams.MATCH_PARENT,
                    ViewGroup.LayoutParams.MATCH_PARENT));
        }

        mAdView = new AdView(this);
        mAdView.setAdSize(AdSize.BANNER);
        mAdView.setAdUnitId(BANNER_AD_UNIT_ID);

        LinearLayout.LayoutParams adParams = new LinearLayout.LayoutParams(
                ViewGroup.LayoutParams.MATCH_PARENT,
                ViewGroup.LayoutParams.WRAP_CONTENT);
        adParams.gravity = Gravity.CENTER_HORIZONTAL;
        wrapper.addView(mAdView, adParams);

        mAdView.loadAd(new AdRequest.Builder().build());
    }

    // ── App Open ad ───────────────────────────────────────────────────────────

    private void loadAppOpenAd() {
        if (mIsLoadingAd || isAdAvailable()) return;
        mIsLoadingAd = true;

        AppOpenAd.load(
            this,
            APP_OPEN_AD_UNIT_ID,
            new AdRequest.Builder().build(),
            new AppOpenAd.AppOpenAdLoadCallback() {
                @Override
                public void onAdLoaded(@NonNull AppOpenAd ad) {
                    mAppOpenAd   = ad;
                    mIsLoadingAd = false;
                    mLoadTimeMs  = System.currentTimeMillis();
                }

                @Override
                public void onAdFailedToLoad(@NonNull LoadAdError error) {
                    mIsLoadingAd = false;
                }
            }
        );
    }

    private boolean isAdAvailable() {
        return mAppOpenAd != null
            && (System.currentTimeMillis() - mLoadTimeMs) < AD_EXPIRY_MS;
    }

    private void showAppOpenAd() {
        if (mIsShowingAd || !isAdAvailable()) {
            loadAppOpenAd();
            return;
        }

        mAppOpenAd.setFullScreenContentCallback(new FullScreenContentCallback() {
            @Override
            public void onAdDismissedFullScreenContent() {
                mAppOpenAd   = null;
                mIsShowingAd = false;
                loadAppOpenAd();
            }

            @Override
            public void onAdFailedToShowFullScreenContent(@NonNull AdError error) {
                mAppOpenAd   = null;
                mIsShowingAd = false;
                loadAppOpenAd();
            }

            @Override
            public void onAdShowedFullScreenContent() {
                mIsShowingAd = true;
            }
        });

        mAppOpenAd.show(this);
    }

    // ── Lifecycle observer — triggers App Open on foreground ──────────────────

    private void registerLifecycleObserver() {
        ProcessLifecycleOwner.get().getLifecycle().addObserver(
            new DefaultLifecycleObserver() {
                @Override
                public void onStart(@NonNull LifecycleOwner owner) {
                    showAppOpenAd();
                }
            }
        );
    }

    // ── Banner lifecycle ──────────────────────────────────────────────────────

    @Override
    protected void onPause() {
        if (mAdView != null) mAdView.pause();
        super.onPause();
    }

    @Override
    protected void onResume() {
        super.onResume();
        if (mAdView != null) mAdView.resume();
    }

    @Override
    protected void onDestroy() {
        if (mAdView != null) mAdView.destroy();
        super.onDestroy();
    }
}
