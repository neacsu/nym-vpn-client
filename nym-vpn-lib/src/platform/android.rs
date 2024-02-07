// Copyright 2023 - Nym Technologies SA <contact@nymtech.net>
// SPDX-License-Identifier: Apache-2.0

use super::*;
use crate::gateway_client::{EntryPoint, ExitPoint};
use crate::NymVpn;
use jnix::jni::objects::{JClass, JObject, JString};
use jnix::jni::JNIEnv;
use jnix::IntoJava;
use jnix::{FromJava, JnixEnv};
use std::str::FromStr;
use std::sync::Arc;
use talpid_tunnel::tun_provider::TunConfig;
use talpid_types::android::AndroidContext;
use url::Url;

fn init_jni_logger() {
    use android_logger::{Config, FilterBuilder};

    android_logger::init_once(
        Config::default()
            .with_max_level(LevelFilter::Trace)
            .with_tag("libnymvpn")
            .with_filter(
                FilterBuilder::new()
                    .parse("debug,tungstenite=warn,mio=warn,tokio_tungstenite=warn")
                    .build(),
            ),
    );
    log::debug!("Logger initialized");
}

#[no_mangle]
#[allow(non_snake_case)]
pub extern "system" fn Java_net_nymtech_vpn_NymVpnService_initVPN(
    env: JNIEnv<'_>,
    _this: JObject<'_>,
    api_url: JString<'_>,
    entry_gateway: JString<'_>,
    exit_router: JString<'_>,
    vpn_service: JObject<'_>,
) {
    if RUNTIME.block_on(get_vpn_state()) != ClientState::Uninitialised {
        warn!("VPN was already inited. Try starting it");
        return;
    }

    init_jni_logger();

    let env = JnixEnv::from(env);
    let context = AndroidContext {
        jvm: Arc::new(env.get_java_vm().expect("Get JVM instance")),
        vpn_service: env
            .new_global_ref(vpn_service)
            .expect("Create global reference"),
    };
    let api_url = Url::from_str(&String::from_java(&env, api_url)).expect("Invalid url");
    let entry_gateway: EntryPoint = serde_json::from_str(&String::from_java(&env, entry_gateway))
        .expect("Invalid entry gateway");
    let exit_router: ExitPoint =
        serde_json::from_str(&String::from_java(&env, exit_router)).expect("Invalid exit router");

    let mut vpn = NymVpn::new(entry_gateway, exit_router, context);
    vpn.gateway_config.api_url = api_url;

    RUNTIME.block_on(set_inited_vpn(vpn));
}

#[no_mangle]
#[allow(non_snake_case)]
pub extern "system" fn Java_net_nymtech_vpn_NymVpnService_runVPN(_env: JNIEnv, _class: JClass) {
    let state = RUNTIME.block_on(get_vpn_state());
    if state != ClientState::Disconnected {
        warn!("Invalid vpn state: {:?}", state);
        return;
    }

    let vpn = RUNTIME
        .block_on(take_vpn())
        .expect("VPN configuration was cleared before it could be used");

    RUNTIME.spawn(async move {
        _async_run_vpn(vpn)
            .await
            .map_err(|err| {
                warn!("failed to run vpn: {}", err);
            })
            .ok();
    });
}

#[allow(non_snake_case)]
#[no_mangle]
pub extern "system" fn Java_net_nymtech_vpn_NymVpnService_stopVPN(_env: JNIEnv, _class: JClass) {
    if RUNTIME.block_on(get_vpn_state()) != ClientState::Connected {
        warn!("could not stop the vpn as it's not running");
        return;
    }
    RUNTIME.block_on(stop_and_reset_shutdown_handle());
}

#[no_mangle]
#[allow(non_snake_case)]
pub extern "system" fn Java_net_nymtech_vpn_NymVpnService_defaultTunConfig<'env>(
    env: JNIEnv<'env>,
    _this: JObject<'_>,
) -> JObject<'env> {
    let env = JnixEnv::from(env);

    TunConfig::default().into_java(&env).forget()
}
