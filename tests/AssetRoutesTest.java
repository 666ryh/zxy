package cn.kejian.teacher;

import java.io.*;
import java.net.URI;
import java.nio.charset.StandardCharsets;
import java.util.*;
import java.util.jar.*;
import java.util.regex.*;

/** Runs the same resource resolver used by the Android activity against the APK. */
public final class AssetRoutesTest {
    private static void require(boolean value,String message){if(!value)throw new AssertionError(message);}
    public static void main(String[] args) throws Exception {
        require("web/index.html".equals(AssetRoutes.assetPath(AssetRoutes.ORIGIN)),"root page");
        require("web/index.html".equals(AssetRoutes.assetPath("https://app.kejian.local")),"empty path root");
        require("web/assets/page.js".equals(AssetRoutes.assetPath(AssetRoutes.ORIGIN+"assets/page.js?v=1")),"query path");
        for(String url:new String[]{"https://evil.example/index.html","https://app.kejian.local.evil/index.html",AssetRoutes.ORIGIN+"%2e%2e/private",AssetRoutes.ORIGIN+"a//b",AssetRoutes.ORIGIN+"a%5cb", "https://app.kejian.local:444/index.html"}){
            try{AssetRoutes.assetPath(url);throw new AssertionError("accepted: "+url);}catch(IOException expected){}
        }
        require("application/javascript".equals(AssetRoutes.mime("web/assets/index.js")),"module MIME");
        require("image/png".equals(AssetRoutes.mime("web/static/image.png")),"image MIME");
        if(args.length==0){System.out.println("Asset route checks passed");return;}
        try(JarFile apk=new JarFile(args[0])){
            String home=new String(read(apk,"assets/"+AssetRoutes.assetPath(AssetRoutes.ORIGIN)),StandardCharsets.UTF_8);
            require(home.contains("type=\"module\""),"H5 module entry");
            Matcher refs=Pattern.compile("(?:src|href)=\"(/[^\"]+)\"").matcher(home);int count=0;
            while(refs.find()){String resolved=URI.create(AssetRoutes.ORIGIN).resolve(refs.group(1)).toString();require(read(apk,"assets/"+AssetRoutes.assetPath(resolved)).length>0,"entry asset missing");count++;}
            require(count>=3,"Expected JS and CSS resources");
            Enumeration<JarEntry> entries=apk.entries();int assets=0;
            while(entries.hasMoreElements()){String name=entries.nextElement().getName();if(!name.startsWith("assets/web/")||name.endsWith("/"))continue;String url=AssetRoutes.ORIGIN+name.substring("assets/web/".length());require(("assets/"+AssetRoutes.assetPath(url)).equals(name),"resource route mismatch");require(read(apk,name).length>0,"empty resource");assets++;}
            System.out.println("APK entry and all "+assets+" embedded assets passed");
        }
    }
    private static byte[] read(JarFile jar,String path) throws IOException{JarEntry entry=jar.getJarEntry(path);if(entry==null)throw new IOException("Missing "+path);try(InputStream in=jar.getInputStream(entry);ByteArrayOutputStream out=new ByteArrayOutputStream()){byte[] b=new byte[8192];int n;while((n=in.read(b))!=-1)out.write(b,0,n);return out.toByteArray();}}
}
