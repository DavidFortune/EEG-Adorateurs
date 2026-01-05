// GENERATED CODE - DO NOT MODIFY BY HAND

part of 'streamio_auth_token.dart';

// **************************************************************************
// TypeAdapterGenerator
// **************************************************************************

class StreamIOAuthTokenAdapter extends TypeAdapter<StreamIOAuthToken> {
  @override
  final typeId = 0;

  @override
  StreamIOAuthToken read(BinaryReader reader) {
    final numOfFields = reader.readByte();
    final fields = <int, dynamic>{
      for (int i = 0; i < numOfFields; i++) reader.readByte(): reader.read(),
    };
    return StreamIOAuthToken(
      token: fields[0] as String,
      userId: fields[1] as String,
      cachedAt: fields[2] as DateTime,
      expiresAt: fields[3] as DateTime?,
    );
  }

  @override
  void write(BinaryWriter writer, StreamIOAuthToken obj) {
    writer
      ..writeByte(4)
      ..writeByte(0)
      ..write(obj.token)
      ..writeByte(1)
      ..write(obj.userId)
      ..writeByte(2)
      ..write(obj.cachedAt)
      ..writeByte(3)
      ..write(obj.expiresAt);
  }

  @override
  int get hashCode => typeId.hashCode;

  @override
  bool operator ==(Object other) =>
      identical(this, other) ||
      other is StreamIOAuthTokenAdapter &&
          runtimeType == other.runtimeType &&
          typeId == other.typeId;
}
