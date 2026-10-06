package expo.modules.phonepicker

import android.app.Activity
import android.content.ActivityNotFoundException
import android.content.Intent
import android.provider.ContactsContract.CommonDataKinds.Phone
import expo.modules.kotlin.Promise
import expo.modules.kotlin.modules.Module
import expo.modules.kotlin.modules.ModuleDefinition

private const val RC_PICK_PHONE = 47219

/**
 * Rehber izni (READ_CONTACTS) olmadan telefon numarası seçtirir.
 *
 * Sistemin kişi uygulaması "telefon numarası seç" ekranını açar; kullanıcı bir
 * numara seçince yalnızca o satırın adresi, geçici okuma yetkisiyle birlikte
 * uygulamaya döner. Uygulama rehberin geri kalanını göremez. (expo-contacts'in
 * Android seçicisi kişinin tamamını rehberden okuduğu için izin istiyor.)
 */
class PhonePickerModule : Module() {
  private var pendingPromise: Promise? = null

  override fun definition() = ModuleDefinition {
    Name("PhonePicker")

    AsyncFunction("pickPhoneAsync") { promise: Promise ->
      if (pendingPromise != null) {
        promise.reject("ERR_PICK_IN_PROGRESS", "A phone number pick is already in progress", null)
        return@AsyncFunction
      }
      val activity = appContext.currentActivity
      if (activity == null) {
        promise.reject("ERR_NO_ACTIVITY", "No foreground activity to show the picker", null)
        return@AsyncFunction
      }
      val intent = Intent(Intent.ACTION_PICK, Phone.CONTENT_URI)
      pendingPromise = promise
      try {
        activity.startActivityForResult(intent, RC_PICK_PHONE)
      } catch (e: ActivityNotFoundException) {
        pendingPromise = null
        promise.reject("ERR_PICKER_UNAVAILABLE", "No app can pick a phone number", e)
      }
    }

    OnActivityResult { _, payload ->
      if (payload.requestCode != RC_PICK_PHONE) return@OnActivityResult
      val promise = pendingPromise ?: return@OnActivityResult
      pendingPromise = null

      val uri = payload.data?.data
      if (payload.resultCode != Activity.RESULT_OK || uri == null) {
        promise.resolve(null)
        return@OnActivityResult
      }

      try {
        val resolver = appContext.reactContext?.contentResolver
        if (resolver == null) {
          promise.reject("ERR_NO_CONTEXT", "React context is not available", null)
          return@OnActivityResult
        }
        var number: String? = null
        var name: String? = null
        resolver.query(uri, arrayOf(Phone.NUMBER, Phone.DISPLAY_NAME), null, null, null)?.use { cursor ->
          if (cursor.moveToFirst()) {
            number = cursor.getString(0)
            name = cursor.getString(1)
          }
        }
        if (number.isNullOrBlank()) {
          promise.resolve(null)
        } else {
          promise.resolve(mapOf("number" to number, "name" to name))
        }
      } catch (e: SecurityException) {
        promise.reject("ERR_NO_ACCESS", "The contacts app did not grant access to the picked number", e)
      }
    }
  }
}
