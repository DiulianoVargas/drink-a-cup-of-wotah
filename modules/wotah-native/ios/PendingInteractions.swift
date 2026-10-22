import Foundation

/// Live Activity taps waiting for JS, stored in the App Group shared with the widget extension.
/// expo-widgets' `LiveActivityUserInteraction` only posts an in-process notification; when iOS
/// launches a terminated app for that intent, JS is not listening yet, so we persist the event here
/// and `drainPendingInteractions()` hands it to JS on boot (research › Implementation findings).
enum PendingInteractions {
  static let storageKey = "wotah.pendingLiveActivityInteractions"
  static let maxStored = 200
  private static let lock = NSLock()

  private static var defaults: UserDefaults? {
    // Same App Group expo-widgets uses (set by its config plugin).
    guard let group = Bundle.main.object(forInfoDictionaryKey: "ExpoWidgetsAppGroupIdentifier") as? String else {
      return nil
    }
    return UserDefaults(suiteName: group)
  }

  /// Keeps only property-list-safe values (String / Int) from the expo-widgets event payload.
  static func append(_ eventData: [String: Any]) {
    var event: [String: Any] = [:]
    for key in ["source", "target", "type"] {
      if let value = eventData[key] as? String { event[key] = value }
    }
    if let timestamp = eventData["timestamp"] as? Int {
      event["timestamp"] = timestamp
    } else if let timestamp = eventData["timestamp"] as? NSNumber {
      event["timestamp"] = timestamp.intValue
    } else {
      event["timestamp"] = Int(Date().timeIntervalSince1970 * 1000)
    }
    guard event["target"] != nil else { return }

    lock.lock()
    defer { lock.unlock() }
    guard let defaults else { return }
    var list = defaults.array(forKey: storageKey) as? [[String: Any]] ?? []
    list.append(event)
    if list.count > maxStored { list.removeFirst(list.count - maxStored) }
    defaults.set(list, forKey: storageKey)
  }

  /// Returns every pending event and clears the queue.
  static func drain() -> [[String: Any]] {
    lock.lock()
    defer { lock.unlock() }
    guard let defaults else { return [] }
    let list = defaults.array(forKey: storageKey) as? [[String: Any]] ?? []
    defaults.removeObject(forKey: storageKey)
    return list
  }
}
