import ExpoModulesCore
#if canImport(AlarmKit)
import ActivityKit
import AlarmKit
import SwiftUI

@available(iOS 26.0, *)
struct LoclockAlarmMetadata: AlarmMetadata {}
#endif

public class LoclockAlarmModule: Module {
  public func definition() -> ModuleDefinition {
    Name("LoclockAlarm")

    Function("isAvailable") { () -> Bool in
      #if canImport(AlarmKit)
      if #available(iOS 26.0, *) { return true }
      #endif
      return false
    }

    Function("getAuthorizationStatus") { () -> String in
      #if canImport(AlarmKit)
      if #available(iOS 26.0, *) {
        return Self.describe(AlarmManager.shared.authorizationState)
      }
      #endif
      return "unavailable"
    }

    AsyncFunction("requestAuthorization") { () async throws -> String in
      #if canImport(AlarmKit)
      if #available(iOS 26.0, *) {
        return Self.describe(try await AlarmManager.shared.requestAuthorization())
      }
      #endif
      return "unavailable"
    }

    // Schedules a system alarm one second from now. Returns false when AlarmKit
    // can't be used, so the caller can fall back to a notification.
    AsyncFunction("fireNow") { (title: String, soundFile: String?) async throws -> Bool in
      #if canImport(AlarmKit)
      if #available(iOS 26.0, *) {
        guard AlarmManager.shared.authorizationState == .authorized else { return false }

        let titleResource = LocalizedStringResource(String.LocalizationValue(title))
        let alert: AlarmPresentation.Alert
        if #available(iOS 26.1, *) {
          alert = AlarmPresentation.Alert(title: titleResource)
        } else {
          alert = AlarmPresentation.Alert(
            title: titleResource,
            stopButton: AlarmButton(text: "Stop", textColor: .white, systemImageName: "stop.circle")
          )
        }
        let attributes = AlarmAttributes<LoclockAlarmMetadata>(
          presentation: AlarmPresentation(alert: alert),
          tintColor: Color(red: 0.0, green: 0.4, blue: 0.525)
        )
        let sound: AlertConfiguration.AlertSound = soundFile.map { .named($0) } ?? .default
        let configuration = AlarmManager.AlarmConfiguration<LoclockAlarmMetadata>(
          schedule: .fixed(Date().addingTimeInterval(1)),
          attributes: attributes,
          sound: sound
        )
        _ = try await AlarmManager.shared.schedule(id: UUID(), configuration: configuration)
        return true
      }
      #endif
      return false
    }
  }

  #if canImport(AlarmKit)
  @available(iOS 26.0, *)
  private static func describe(_ state: AlarmManager.AuthorizationState) -> String {
    switch state {
    case .authorized: return "authorized"
    case .denied: return "denied"
    case .notDetermined: return "notDetermined"
    @unknown default: return "denied"
    }
  }
  #endif
}
