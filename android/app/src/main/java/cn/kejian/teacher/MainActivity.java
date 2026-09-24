package cn.kejian.teacher;

import android.app.Activity;
import android.app.AlertDialog;
import android.content.Intent;
import android.net.Uri;
import android.os.Bundle;
import android.util.AtomicFile;
import android.webkit.*;
import java.io.*;
import java.nio.charset.StandardCharsets;
import org.json.JSONObject;

/** Offline-only WebView. The bridge is reachable solely from bundled assets. */
public class MainActivity extends Activity {
    private WebView web;
    private AtomicFile database;
    private String pendingExport;
    private static final String ORIGIN = "https://app.kejian.local/";
    private static final int EXPORT = 101, IMPORT = 102, MAX_SIZE = 5_000_000;

    @Override public void onCreate(Bundle saved) {
        super.onCreate(saved);
        database = new AtomicFile(new File(getFilesDir(), "teacher.json"));
        web = new WebView(this);
        WebSettings settings = web.getSettings();
        settings.setJavaScriptEnabled(true);
        settings.setDomStorageEnabled(true);
        settings.setAllowFileAccess(false);
        settings.setAllowContentAccess(false);
        settings.setMixedContentMode(WebSettings.MIXED_CONTENT_NEVER_ALLOW);
        settings.setTextZoom(Math.round(getResources().getConfiguration().fontScale * 100));
        web.addJavascriptInterface(new LocalBridge(), "Native");
        web.setWebViewClient(new WebViewClient() {
            @Override public boolean shouldOverrideUrlLoading(WebView view, WebResourceRequest request) {
                return !request.getUrl().toString().startsWith(ORIGIN);
            }
            @Override public WebResourceResponse shouldInterceptRequest(WebView view, WebResourceRequest request) {
                String url = request.getUrl().toString();
                try {
                    if (!url.startsWith(ORIGIN)) throw new IOException("External request blocked");
                    String path = request.getUrl().getPath();
                    if (path == null || path.equals("/")) path = "/index.html";
                    if (!path.matches("/[a-zA-Z0-9._-]+")) throw new IOException("Invalid asset");
                    String mime = path.endsWith(".js") ? "text/javascript" : path.endsWith(".css") ? "text/css" : "text/html";
                    return new WebResourceResponse(mime,"UTF-8",getAssets().open("web"+path));
                } catch (IOException e) {
                    return new WebResourceResponse("text/plain","UTF-8",404,"Not found",null,new ByteArrayInputStream(new byte[0]));
                }
            }
        });
        web.setWebChromeClient(new WebChromeClient(){
            @Override public boolean onJsAlert(WebView view,String url,String message,JsResult result){
                new AlertDialog.Builder(MainActivity.this).setMessage(message).setPositiveButton("知道了",(d,w)->result.confirm()).setOnCancelListener(d->result.cancel()).show();return true;
            }
            @Override public boolean onJsConfirm(WebView view,String url,String message,JsResult result){
                new AlertDialog.Builder(MainActivity.this).setMessage(message).setPositiveButton("确认",(d,w)->result.confirm()).setNegativeButton("取消",(d,w)->result.cancel()).setOnCancelListener(d->result.cancel()).show();return true;
            }
        });
        setContentView(web);
        web.loadUrl(ORIGIN);
    }

    private String readLimited(InputStream stream) throws IOException {
        try(InputStream in=stream;ByteArrayOutputStream out=new ByteArrayOutputStream()){
            byte[] buffer=new byte[8192];int n;
            while((n=in.read(buffer))!=-1){if(out.size()+n>MAX_SIZE)throw new IOException("文件超过5MB");out.write(buffer,0,n);}
            return out.toString("UTF-8");
        }
    }
    private void feedback(String text){runOnUiThread(()->web.evaluateJavascript("window.nativeFeedback("+JSONObject.quote(text)+")",null));}
    public class LocalBridge {
        @JavascriptInterface public synchronized String load(){
            try {if(!database.getBaseFile().exists()&&!new File(database.getBaseFile()+".bak").exists())return "";return readLimited(database.openRead());}
            catch(Exception e){return "{\"readError\":true}";}
        }
        @JavascriptInterface public synchronized String save(String json){
            FileOutputStream out=null;
            try {if(json==null)throw new IOException("数据为空");byte[] encoded=json.getBytes(StandardCharsets.UTF_8);if(encoded.length>MAX_SIZE)throw new IOException("数据超过5MB");JSONObject obj=new JSONObject(json);if(obj.getInt("version")!=1)throw new IOException("数据版本无效");if(obj.getJSONArray("students").length()>5000||obj.getJSONArray("lessons").length()>20000)throw new IOException("记录数量超限");out=database.startWrite();out.write(encoded);database.finishWrite(out);return "ok";}
            catch(Exception e){if(out!=null)database.failWrite(out);return "保存失败，原数据已保留："+e.getMessage();}
        }
        @JavascriptInterface public String exportFile(String filename,String mime,String content){
            if(content==null||content.getBytes(StandardCharsets.UTF_8).length>MAX_SIZE)return "导出内容超过5MB";
            runOnUiThread(()->{pendingExport=content;Intent intent=new Intent(Intent.ACTION_CREATE_DOCUMENT);intent.addCategory(Intent.CATEGORY_OPENABLE);intent.setType(mime);intent.putExtra(Intent.EXTRA_TITLE,filename);try{startActivityForResult(intent,EXPORT);}catch(Exception e){pendingExport=null;feedback("无法打开系统文件选择器");}});return "ok";
        }
        @JavascriptInterface public void importFile(){runOnUiThread(()->{Intent intent=new Intent(Intent.ACTION_OPEN_DOCUMENT);intent.addCategory(Intent.CATEGORY_OPENABLE);intent.setType("*/*");try{startActivityForResult(intent,IMPORT);}catch(Exception e){feedback("无法打开系统文件选择器");}});}
    }
    @Override protected void onActivityResult(int request,int result,Intent intent){
        super.onActivityResult(request,result,intent);
        if(result!=RESULT_OK||intent==null||intent.getData()==null){pendingExport=null;return;}
        Uri uri=intent.getData();
        try {
            if(request==EXPORT){if(pendingExport==null)throw new IOException("导出已中断，请重试");try(OutputStream out=getContentResolver().openOutputStream(uri,"wt")){if(out==null)throw new IOException("无法写入文件");out.write(pendingExport.getBytes(StandardCharsets.UTF_8));}pendingExport=null;feedback("文件已保存");}
            if(request==IMPORT){String json=readLimited(getContentResolver().openInputStream(uri));web.evaluateJavascript("window.receiveBackup("+JSONObject.quote(json)+")",null);}
        }catch(Exception e){feedback("文件操作失败："+e.getMessage());}
    }
    @Override public void onBackPressed(){web.evaluateJavascript("window.closeSheet ? window.closeSheet() : false",value->{if(!"true".equals(value))new AlertDialog.Builder(this).setMessage("退出课笺？数据已自动保存。").setPositiveButton("退出",(d,w)->finish()).setNegativeButton("继续使用",null).show();});}
    @Override protected void onDestroy(){web.removeJavascriptInterface("Native");web.destroy();super.onDestroy();}
}
