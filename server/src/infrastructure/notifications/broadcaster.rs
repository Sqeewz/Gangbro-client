use tokio::sync::broadcast;
use serde_json::Value;

pub struct GlobalBroadcaster {
    pub tx: broadcast::Sender<Value>,
}

impl GlobalBroadcaster {
    pub fn new() -> Self {
        let (tx, _) = broadcast::channel(1024);
        Self { tx }
    }

    pub fn broadcast(&self, msg: Value) {
        let _ = self.tx.send(msg);
    }
}
