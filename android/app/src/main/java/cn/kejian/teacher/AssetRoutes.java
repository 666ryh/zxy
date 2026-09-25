package cn.kejian.teacher;
import java.io.IOException;
import java.net.URI;

final class AssetRoutes {
    static final String ORIGIN="https://app.kejian.local/";
    static final String CLOUD_ORIGIN="https://www.ryh6666.xyz/";
    static boolean isCloud(String url){try{URI uri=URI.create(url);return "https".equalsIgnoreCase(uri.getScheme())&&"www.ryh6666.xyz".equalsIgnoreCase(uri.getHost())&&uri.getUserInfo()==null&&(uri.getPort()==-1||uri.getPort()==443);}catch(IllegalArgumentException e){return false;}}
    static String assetPath(String url) throws IOException {
        try {
            URI uri=URI.create(url);
            if("file".equalsIgnoreCase(uri.getScheme())){
                String filePath=uri.getPath();
                if(filePath==null||!filePath.startsWith("/android_asset/"))throw new IOException("External file blocked");
                String asset=filePath.substring("/android_asset/".length());
                if(!asset.matches("[a-zA-Z0-9._/-]+")||asset.contains("..")||asset.contains("//"))throw new IOException("Invalid asset path");
                return asset;
            }
            if(!"https".equalsIgnoreCase(uri.getScheme())||!"app.kejian.local".equalsIgnoreCase(uri.getHost())||uri.getUserInfo()!=null||(uri.getPort()!=-1&&uri.getPort()!=443))throw new IOException("External URL blocked");
            String path=uri.getPath();
            if(path==null||path.isEmpty()||path.equals("/"))path="/index.html";
            if(!path.matches("/[a-zA-Z0-9._/-]+")||path.contains("..")||path.contains("//"))throw new IOException("Invalid resource path");
            return "web"+path;
        }catch(IllegalArgumentException e){throw new IOException("Invalid resource URL",e);}
    }
    static String mime(String path){
        if(path.endsWith(".js"))return "application/javascript";
        if(path.endsWith(".css"))return "text/css";
        if(path.endsWith(".html"))return "text/html";
        if(path.endsWith(".svg"))return "image/svg+xml";
        if(path.endsWith(".png"))return "image/png";
        if(path.endsWith(".jpg")||path.endsWith(".jpeg"))return "image/jpeg";
        if(path.endsWith(".webp"))return "image/webp";
        if(path.endsWith(".woff2"))return "font/woff2";
        if(path.endsWith(".ttf"))return "font/ttf";
        if(path.endsWith(".json"))return "application/json";
        return "application/octet-stream";
    }
}
