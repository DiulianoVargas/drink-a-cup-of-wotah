Pod::Spec.new do |s|
  s.name           = 'WotahNative'
  s.version        = '1.0.0'
  s.summary        = 'Wotah native glue: persists Live Activity taps until JS can process them.'
  s.description    = 'Local Expo module (Constitution III, Phase 9 fallback).'
  s.author         = ''
  s.homepage       = 'https://github.com/DiulianoVargas/drink-a-cup-of-wotah'
  s.platforms      = { :ios => '16.4' }
  s.swift_version  = '5.9'
  s.source         = { git: '' }
  s.static_framework = true

  s.dependency 'ExpoModulesCore'

  s.source_files = "**/*.{h,m,swift}"
  s.pod_target_xcconfig = {
    'DEFINES_MODULE' => 'YES',
    'SWIFT_COMPILATION_MODE' => 'wholemodule'
  }
end
