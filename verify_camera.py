import cv2

index = 0
arr = []
while True:
    cap = cv2.VideoCapture(index)
    if cap.isOpened():
        arr.append(index)
        cap.release()
    else:
        break
    index += 1

print("Cámaras disponibles:", arr)
