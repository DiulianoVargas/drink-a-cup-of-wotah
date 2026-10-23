import ExpoModulesCore

/// Name posted by expo-widgets (`WidgetsModule.swift`: `onUserInteractionNotification`).
private let expoWidgetsInteraction = Notification.Name("onExpoWidgetsUserInteraction")

/// Starts recording Live Activity taps as early as possible in the app process, before the
/// LiveActivityIntent runs and before the JS bundle loads.
public class WotahAppDelegateSubscriber: BaseExpoAppDelegateSubscriber, ExpoAppDelegateSubscriberProtocol {
  private var observer: NSObjectProtocol?

  @MainActor
  public func subscriberDidRegister() {
    guard observer == nil else { return }
    observer = NotificationCenter.default.addObserver(
      forName: expoWidgetsInteraction,
      object: nil,
      queue: nil
    ) { notification in
      guard let eventData = notification.userInfo?["eventData"] as? [String: Any] else { return }
      PendingInteractions.append(eventData)
    }
  }

  deinit {
    if let observer { NotificationCenter.default.removeObserver(observer) }
  }
}
