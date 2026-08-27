import 'package:dio/dio.dart';

import '../../core/config/app_config.dart';

/// Thin REST client. Every repository talks to this, never to Dio directly,
/// so swapping transport or adding auth headers is a one-file change.
class ApiClient {
  ApiClient({Dio? dio})
      : _dio = dio ??
            Dio(BaseOptions(
              baseUrl: AppConfig.apiBaseUrl,
              connectTimeout: const Duration(seconds: 12),
              receiveTimeout: const Duration(seconds: 20),
              headers: {'Content-Type': 'application/json'},
            ));

  final Dio _dio;

  /// Injected by the auth layer once Firebase Auth is wired up.
  void setAuthToken(String? token) {
    if (token == null) {
      _dio.options.headers.remove('Authorization');
    } else {
      _dio.options.headers['Authorization'] = 'Bearer $token';
    }
  }

  Future<List<Map<String, dynamic>>> getList(
    String path, {
    Map<String, dynamic>? query,
  }) async {
    final res = await _guard(() => _dio.get(path, queryParameters: query));
    final data = res.data;
    final list = data is Map ? data['data'] : data;
    return (list as List).cast<Map<String, dynamic>>();
  }

  Future<Map<String, dynamic>> getOne(String path) async {
    final res = await _guard(() => _dio.get(path));
    final data = res.data;
    return (data is Map && data['data'] is Map
        ? data['data']
        : data) as Map<String, dynamic>;
  }

  Future<Map<String, dynamic>> post(String path, Map<String, dynamic> body) async {
    final res = await _guard(() => _dio.post(path, data: body));
    return (res.data as Map).cast<String, dynamic>();
  }

  Future<void> delete(String path) => _guard(() => _dio.delete(path));

  Future<Response<dynamic>> _guard(Future<Response<dynamic>> Function() run) async {
    try {
      return await run();
    } on DioException catch (e) {
      throw ApiException.fromDio(e);
    }
  }
}

/// User-facing failure. The UI never renders a raw exception.
class ApiException implements Exception {
  const ApiException(this.message, {this.isOffline = false, this.statusCode});

  final String message;
  final bool isOffline;
  final int? statusCode;

  factory ApiException.fromDio(DioException e) {
    switch (e.type) {
      case DioExceptionType.connectionError:
      case DioExceptionType.connectionTimeout:
      case DioExceptionType.receiveTimeout:
      case DioExceptionType.sendTimeout:
        return const ApiException(
          "You're offline. Showing what we have saved.",
          isOffline: true,
        );
      case DioExceptionType.badResponse:
        final code = e.response?.statusCode;
        if (code == 401 || code == 403) {
          return ApiException('Please sign in again to continue.',
              statusCode: code);
        }
        if (code != null && code >= 500) {
          return ApiException('Our servers are having a moment. Try again.',
              statusCode: code);
        }
        return ApiException("That didn't work. Please try again.",
            statusCode: code);
      default:
        return const ApiException("Something went wrong. Please try again.");
    }
  }

  @override
  String toString() => message;
}
