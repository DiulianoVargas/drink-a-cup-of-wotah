import ExpoModulesCore

public class WotahNativeModule: Module {
  public func definition() -> ModuleDefinition {
    Name("WotahNative")

    /// Live Activity taps recorded natively since the last call (oldest first).
    Function("drainPendingInteractions") { () -> [[String: Any]] in
      PendingInteractions.drain()
    }
  }
}
