import 'dart:convert';
import 'package:flutter/material.dart';
import 'package:http/http.dart' as http;

void main() {
  runApp(const GRProxyApp());
}

class GRProxyApp extends StatelessWidget {
  const GRProxyApp({super.key});

  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      title: 'GRPROXY',
      debugShowCheckedModeBanner: false,
      theme: ThemeData.dark().copyWith(
        scaffoldBackgroundColor: const Color(0xFF090D16),
        primaryColor: const Color(0xFF10B981),
        colorScheme: const ColorScheme.dark(
          primary: Color(0xFF10B981),
          secondary: Color(0xFF06B6D4),
          surface: Color(0xFF111827),
        ),
      ),
      home: const HomeScreen(),
    );
  }
}

class NodeItem {
  final String id;
  final String name;
  final String country;
  final String flag;
  final String city;
  final String cleanIp;
  final int ping;
  final String vlessLink;

  NodeItem({
    required this.id,
    required this.name,
    required this.country,
    required this.flag,
    required this.city,
    required this.cleanIp,
    required this.ping,
    required this.vlessLink,
  });

  factory NodeItem.fromJson(Map<String, dynamic> json) {
    return NodeItem(
      id: json['id'] ?? '',
      name: json['name'] ?? '',
      country: json['country'] ?? '',
      flag: json['flag'] ?? '🌐',
      city: json['city'] ?? '',
      cleanIp: json['cleanIp'] ?? '',
      ping: json['pingEstimate'] ?? 99,
      vlessLink: json['vlessLink'] ?? '',
    );
  }
}

class HomeScreen extends StatefulWidget {
  const HomeScreen({super.key});

  @override
  State<HomeScreen> createState() => _HomeScreenState();
}

class _HomeScreenState extends State<HomeScreen> {
  static const String backendUrl = 'https://grproxy.grwebdevs5.workers.dev/api/nodes';
  List<NodeItem> nodes = [];
  NodeItem? selectedNode;
  bool isConnected = false;
  bool isLoading = true;
  String statusMessage = "Tap Connect to Start";

  // Split Tunneling Configuration (Selected Apps to Proxy)
  final Map<String, bool> selectedApps = {
    'Telegram Messenger': true,
    'Telegram X': true,
    'Discord': true,
    'PUBG Mobile': false,
    'Free Fire': false,
    'JazzCash (Bypassed - Full 4G)': false,
    'Easypaisa (Bypassed - Full 4G)': false,
    'HBL Mobile (Bypassed - Full 4G)': false,
    'WhatsApp (Bypassed - Full 4G)': false,
    'YouTube (Bypassed - Full 4G)': false,
  };

  @override
  void initState() {
    super.initState();
    fetchNodes();
  }

  Future<void> fetchNodes() async {
    setState(() => isLoading = true);
    try {
      final res = await http.get(Uri.parse(backendUrl)).timeout(const Duration(seconds: 8));
      if (res.statusCode == 200) {
        final data = jsonDecode(res.body);
        final list = (data['nodes'] as List).map((i) => NodeItem.fromJson(i)).toList();
        setState(() {
          nodes = list;
          if (nodes.isNotEmpty) selectedNode = nodes.first;
          isLoading = false;
        });
        return;
      }
    } catch (_) {
      // Fallback offline nodes
    }

    // Default regional nodes
    final fallback = [
      NodeItem(id: 'ae-dxb', name: 'GRPROXY 🇦🇪 UAE (Dubai Edge)', country: 'UAE', flag: '🇦🇪', city: 'Dubai', cleanIp: '172.67.182.11', ping: 35, vlessLink: ''),
      NodeItem(id: 'sg-sin', name: 'GRPROXY 🇸🇬 Singapore', country: 'Singapore', flag: '🇸🇬', city: 'Singapore', cleanIp: '104.16.24.4', ping: 62, vlessLink: ''),
      NodeItem(id: 'de-fra', name: 'GRPROXY 🇩🇪 Germany (Frankfurt)', country: 'Germany', flag: '🇩🇪', city: 'Frankfurt', cleanIp: '104.17.150.10', ping: 85, vlessLink: ''),
      NodeItem(id: 'gb-lon', name: 'GRPROXY 🇬🇧 UK (London)', country: 'UK', flag: '🇬🇧', city: 'London', cleanIp: '104.18.28.5', ping: 98, vlessLink: ''),
      NodeItem(id: 'us-nyc', name: 'GRPROXY 🇺🇸 USA (New York)', country: 'USA', flag: '🇺🇸', city: 'New York', cleanIp: '104.21.32.1', ping: 145, vlessLink: ''),
    ];

    setState(() {
      nodes = fallback;
      selectedNode = fallback.first;
      isLoading = false;
    });
  }

  void toggleConnection() {
    setState(() {
      isConnected = !isConnected;
      statusMessage = isConnected 
        ? "Connected • ${selectedNode?.city} (${selectedNode?.ping}ms)" 
        : "Disconnected";
    });
  }

  void openSplitTunnelDialog() {
    showModalBottomSheet(
      context: context,
      backgroundColor: const Color(0xFF111827),
      shape: const RoundedRectangleBorder(
        borderRadius: BorderRadius.vertical(top: Radius.circular(24)),
      ),
      builder: (ctx) {
        return StatefulBuilder(
          builder: (context, setModalState) {
            return Padding(
              padding: const EdgeInsets.all(20.0),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                mainAxisSize: MainAxisSize.min,
                children: [
                  Row(
                    mainAxisAlignment: MainAxisAlignment.between,
                    children: [
                      const Text(
                        "⚡ Per-App Split Tunneling",
                        style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold, color: Colors.white),
                      ),
                      IconButton(
                        icon: const Icon(Icons.close, color: Colors.grey),
                        onPressed: () => Navigator.pop(context),
                      ),
                    ],
                  ),
                  const Text(
                    "Only checked apps route through GRPROXY. All unchecked banking & media apps run at full native 4G/5G speeds without VPN lag.",
                    style: TextStyle(fontSize: 12, color: Colors.grey),
                  ),
                  const SizedBox(height: 12),
                  Flexible(
                    child: ListView(
                      shrinkWrap: true,
                      children: selectedApps.keys.map((app) {
                        return CheckboxListTile(
                          title: Text(app, style: const TextStyle(fontSize: 13, color: Colors.white)),
                          value: selectedApps[app],
                          activeColor: const Color(0xFF10B981),
                          checkColor: Colors.black,
                          onChanged: (val) {
                            setModalState(() => selectedApps[app] = val ?? false);
                            setState(() => selectedApps[app] = val ?? false);
                          },
                        );
                      }).toList(),
                    ),
                  ),
                ],
              ),
            );
          },
        );
      },
    );
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        backgroundColor: Colors.transparent,
        elevation: 0,
        title: Row(
          children: [
            Container(
              padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
              decoration: BoxDecoration(
                color: const Color(0xFF10B981),
                borderRadius: BorderRadius.circular(8),
              ),
              child: const Text('GR', style: TextStyle(color: Colors.black, fontWeight: FontWeight.bold)),
            ),
            const SizedBox(width: 8),
            const Text('GRPROXY', style: TextStyle(fontWeight: FontWeight.bold, letterSpacing: 1.2)),
          ],
        ),
        actions: [
          IconButton(
            icon: const Icon(Icons.tune, color: Color(0xFF06B6D4)),
            tooltip: "Split Tunneling",
            onPressed: openSplitTunnelDialog,
          ),
          IconButton(
            icon: const Icon(Icons.refresh, color: Colors.grey),
            tooltip: "Refresh Nodes",
            onPressed: fetchNodes,
          ),
        ],
      ),
      body: Padding(
        padding: const EdgeInsets.symmetric(horizontal: 20.0, vertical: 12.0),
        child: Column(
          children: [
            // Status Card
            Container(
              padding: const EdgeInsets.all(16),
              decoration: BoxDecoration(
                color: const Color(0xFF111827),
                borderRadius: BorderRadius.circular(16),
                border: Border.all(
                  color: isConnected ? const Color(0xFF10B981).withOpacity(0.4) : Colors.white10,
                ),
              ),
              child: Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        isConnected ? "PROTECTION ACTIVE" : "DISCONNECTED",
                        style: TextStyle(
                          color: isConnected ? const Color(0xFF10B981) : Colors.grey,
                          fontSize: 11,
                          fontWeight: FontWeight.bold,
                          letterSpacing: 1,
                        ),
                      ),
                      const SizedBox(height: 4),
                      Text(
                        statusMessage,
                        style: const TextStyle(color: Colors.white, fontSize: 13, fontWeight: FontWeight.w600),
                      ),
                    ],
                  ),
                  Icon(
                    isConnected ? Icons.shield : Icons.shield_outlined,
                    color: isConnected ? const Color(0xFF10B981) : Colors.grey,
                    size: 28,
                  ),
                ],
              ),
            ),

            const Spacer(),

            // Big Circular Connect Button
            GestureDetector(
              onTap: toggleConnection,
              child: AnimatedContainer(
                duration: const Duration(milliseconds: 300),
                width: 170,
                height: 170,
                decoration: BoxDecoration(
                  shape: BoxShape.circle,
                  color: isConnected ? const Color(0xFF10B981) : const Color(0xFF1F2937),
                  boxShadow: [
                    BoxShadow(
                      color: isConnected ? const Color(0xFF10B981).withOpacity(0.4) : Colors.transparent,
                      blurRadius: 35,
                      spreadRadius: 8,
                    ),
                  ],
                ),
                child: Center(
                  child: Column(
                    mainAxisAlignment: MainAxisAlignment.center,
                    children: [
                      Icon(
                        Icons.power_settings_new,
                        size: 54,
                        color: isConnected ? Colors.black : Colors.white70,
                      ),
                      const SizedBox(height: 6),
                      Text(
                        isConnected ? "STOP" : "START",
                        style: TextStyle(
                          fontSize: 14,
                          fontWeight: FontWeight.bold,
                          color: isConnected ? Colors.black : Colors.white,
                          letterSpacing: 1.5,
                        ),
                      ),
                    ],
                  ),
                ),
              ),
            ),

            const Spacer(),

            // Country Node Selector
            Align(
              alignment: Alignment.centerLeft,
              child: Row(
                mainAxisAlignment: MainAxisAlignment.between,
                children: [
                  const Text("SELECT REGION", style: TextStyle(fontSize: 11, fontWeight: FontWeight.bold, color: Colors.grey)),
                  TextButton.icon(
                    onPressed: openSplitTunnelDialog,
                    icon: const Icon(Icons.filter_alt, size: 14, color: Color(0xFF06B6D4)),
                    label: const Text("App Filter", style: TextStyle(fontSize: 12, color: Color(0xFF06B6D4))),
                  ),
                ],
              ),
            ),
            const SizedBox(height: 8),

            // Node Dropdown / Card
            Container(
              padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 4),
              decoration: BoxDecoration(
                color: const Color(0xFF111827),
                borderRadius: BorderRadius.circular(16),
                border: Border.all(color: Colors.white12),
              ),
              child: DropdownButtonHideUnderline(
                child: DropdownButton<NodeItem>(
                  isExpanded: true,
                  value: selectedNode,
                  dropdownColor: const Color(0xFF111827),
                  icon: const Icon(Icons.arrow_drop_down, color: Colors.grey),
                  items: nodes.map((n) {
                    return DropdownMenuItem<NodeItem>(
                      value: n,
                      child: Row(
                        children: [
                          Text(n.flag, style: const TextStyle(fontSize: 20)),
                          const SizedBox(width: 12),
                          Expanded(
                            child: Text(
                              "${n.country} (${n.city})",
                              style: const TextStyle(color: Colors.white, fontSize: 13, fontWeight: FontWeight.w600),
                            ),
                          ),
                          Container(
                            padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 2),
                            decoration: BoxDecoration(
                              color: const Color(0xFF06B6D4).withOpacity(0.15),
                              borderRadius: BorderRadius.circular(6),
                            ),
                            child: Text(
                              "~${n.ping}ms",
                              style: const TextStyle(color: Color(0xFF06B6D4), fontSize: 11, fontWeight: FontWeight.bold),
                            ),
                          ),
                        ],
                      ),
                    );
                  }).toList(),
                  onChanged: (NodeItem? val) {
                    setState(() {
                      selectedNode = val;
                      if (isConnected) {
                        statusMessage = "Connected • ${val?.city} (${val?.ping}ms)";
                      }
                    });
                  },
                ),
              ),
            ),

            const SizedBox(height: 20),
          ],
        ),
      ),
    );
  }
}
