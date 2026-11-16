Pod::Spec.new do |s|
  s.name           = 'LoclockAlarm'
  s.version        = '1.0.0'
  s.summary        = 'AlarmKit bridge for LoClock'
  s.description    = 'Fires a system alarm (AlarmKit, iOS 26+) when a geofence is entered.'
  s.author         = ''
  s.homepage       = 'https://github.com/DrawdEA/commute-alarm'
  s.license        = 'MIT'
  s.platforms      = { :ios => '15.1' }
  s.source         = { git: '' }
  s.static_framework = true
  s.dependency 'ExpoModulesCore'
  s.weak_frameworks = 'AlarmKit'
  s.pod_target_xcconfig = { 'DEFINES_MODULE' => 'YES' }
  s.source_files = '**/*.swift'
end
