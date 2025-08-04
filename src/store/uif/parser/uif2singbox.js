import {
  DeepCopy,
  DeleteKeyFromDict
} from "./utils.js";

function Bound(uif_config) {
  var singBoxStyle = DeepCopy(uif_config['setting']);
  var transport = uif_config['transport']
  var proxyProtocol = uif_config['protocol']
  var transportProtocol = transport['protocol'];

  singBoxStyle['type'] = proxyProtocol;
  singBoxStyle['tag'] = uif_config['tag'];

  if (transportProtocol != 'tcp' && transportProtocol != '') {
    var transportSetting = uif_config['transport']['setting']
    transportSetting['type'] = transportProtocol
    singBoxStyle['transport'] = transportSetting
  }

  if (transportProtocol == 'ws' && 'transport' in singBoxStyle &&
    'headers' in singBoxStyle['transport'] &&
    singBoxStyle['transport']['headers']['Host'] == "") {
    delete singBoxStyle['transport']['headers']
  }

  if ('multiplex' in transport) {
    singBoxStyle['multiplex'] = transport['multiplex']
  }

  if (transport['tls_type'] != 'none') {
    singBoxStyle['tls'] = transport['tls']
  }

  if (proxyProtocol == 'hysteria2') {
    if (singBoxStyle['obfs'] != undefined && singBoxStyle['obfs']['type'] == '') {
      delete singBoxStyle['obfs']
    }
  }

  if ('dial' in uif_config && 'detour' in uif_config['dial'] &&
    uif_config['dial']['detour']['tag'] != '') {
    singBoxStyle['detour'] = uif_config['dial']['detour']['tag']
  }

  if ('dial' in uif_config && ["trojan", "vmess", "vless", "shadowsocks"].includes(uif_config['protocol'])) {
    if ('tcp_fast_open' in uif_config['dial'] && uif_config['dial']['tcp_fast_open']) {
      singBoxStyle['tcp_fast_open'] = true
    }
    if ('tcp_multi_path' in uif_config['dial'] && uif_config['dial']['tcp_multi_path']) {
      singBoxStyle['tcp_multi_path'] = true
    }
  }
  return singBoxStyle
}

export function Inbound(uifConfig) {
  var singConfig = Bound(uifConfig)
  singConfig['listen'] = uifConfig['transport']['address'];
  singConfig['listen_port'] = parseInt(uifConfig['transport']['port']);
  // singConfig['sniff'] = true;

  if ('multiplex' in singConfig) {
    if ('protocol' in singConfig['multiplex']) {
      delete singConfig['multiplex']['protocol']
    }

    if ('max_streams' in singConfig['multiplex']) {
      delete singConfig['multiplex']['max_streams']
    }
  }
  if ('tls' in singConfig && 'reality' in singConfig['tls']) {
    DeleteKeyFromDict('public_key', singConfig['tls']['reality'])
  }
  return singConfig
}

export function ParseSSPluginOpts(pluginOpts) {
  var res = []
  for (var item in pluginOpts) {
    res.push(item + '=' + String(pluginOpts[item]))
  }
  return res.join(';')
}

export function Endpoint(uif_config) {
  var setting = DeepCopy(uif_config['setting'])
  var endpoint = {
    'type': 'wireguard',
    'tag': uif_config['tag'],
    'system': setting['system_interface'],
    'name': setting['interface_name'],
    'mtu': setting['mtu'],
    'address': setting['local_address'],
    'private_key': setting['private_key'],
    'workers': setting['workers']
  }

  if ('listen_port' in setting) {
    endpoint['listen_port'] = parseInt(setting['listen_port'])
  }

  var peer = {
    'address': uif_config['transport']['address'],
    'port': parseInt(uif_config['transport']['port']),
    'public_key': setting['peer_public_key'],
    'allowed_ips': setting['allowed_ips'] ? setting['allowed_ips'] : ['0.0.0.0/0'],
    'reserved': setting['reserved']
  }

  if ('pre_shared_key' in setting && setting['pre_shared_key'] != "") {
    peer['pre_shared_key'] = setting['pre_shared_key']
  }

  if ('persistent_keepalive_interval' in setting) {
    peer['persistent_keepalive_interval'] = setting['persistent_keepalive_interval']
  }

  endpoint['peers'] = [peer]

  if ('dial' in uif_config && 'detour' in uif_config['dial'] &&
    uif_config['dial']['detour']['tag'] != '') {
    endpoint['detour'] = uif_config['dial']['detour']['tag']
  }

  if ('dial' in uif_config && 'tcp_fast_open' in uif_config['dial'] && uif_config['dial']['tcp_fast_open']) {
    endpoint['tcp_fast_open'] = true
  }
  if ('dial' in uif_config && 'tcp_multi_path' in uif_config['dial'] && uif_config['dial']['tcp_multi_path']) {
    endpoint['tcp_multi_path'] = true
  }

  return endpoint
}

export function Outbound(uif_config) {
  if (uif_config['protocol'] == 'wireguard') {
    return Endpoint(uif_config)
  }

  var singBoxStyle = Bound(uif_config)
  var protocol = singBoxStyle['type']
  if (protocol == 'freedom') {
    singBoxStyle['type'] = 'direct'
  } else if (protocol != 'block') {
    singBoxStyle['server'] = uif_config['transport']['address']
    singBoxStyle['server_port'] = parseInt(uif_config['transport']['port'])
  }

  if (protocol == 'shadowsocks') {
    if ('plugin' in singBoxStyle) {
      if (singBoxStyle['plugin'] == '') {
        singBoxStyle['plugin_opts'] = ''
      } else {
        singBoxStyle['plugin_opts'] = ParseSSPluginOpts(singBoxStyle['plugin_opts'])
      }
    }
  }

  return singBoxStyle
}
