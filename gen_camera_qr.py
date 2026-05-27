#!/usr/bin/env python3
import qrcode

qr = qrcode.QRCode(error_correction=qrcode.constants.ERROR_CORRECT_H, border=4)
qr.add_data('https://joegraham.studio')
qr.make(fit=True)
img = qr.make_image(fill_color='black', back_color='white')
img.save('camera_qr.png')
print('Saved: camera_qr.png')
